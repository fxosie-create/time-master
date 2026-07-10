package com.ymrlab.timemaster;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.ump.ConsentDebugSettings;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.FormError;
import com.google.android.ump.UserMessagingPlatform;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

/** Hosts the offline Capacitor application and the native-only test/production banner. */
public class MainActivity extends BridgeActivity {
    public static final String TAG_ADS = "TimeMasterAds";
    public static final String TAG_UMP = "TimeMasterUMP";
    public static final String TAG_APP = "TimeMasterApp";
    public static final String TAG_BRIDGE = "TimeMasterBridge";
    private static final String BANNER_VISIBILITY_EVENT = "time-master-native-banner-visibility";

    private FrameLayout adContainer;
    private AdView adView;
    private ConsentInformation consentInformation;
    private boolean adsInitializationStarted;
    private boolean adsInitialized;
    private boolean bannerRequested;
    private boolean consentUpdateInProgress;
    private int bottomSystemInsetPx;
    private String manifestAdMobAppId = "";
    private String testDeviceHash = "";
    private String currentScreen = "startup";
    private String lastAdLoadRequestScreen = "not_requested";
    private String lastAdEvent = "not_started";
    private int lastAdErrorCode = -1;
    private String lastAdErrorDomain = "";
    private String lastAdErrorMessage = "";
    private String lastUmpEvent = "not_started";
    private int lastUmpErrorCode = -1;
    private String lastUmpErrorMessage = "";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Capacitor builds the bridge inside super.onCreate(). Custom plugins must be registered first.
        registerPlugin(TimeMasterNativePlugin.class);
        super.onCreate(savedInstanceState);

        Log.i(TAG_APP, "アプリ起動 build=" + (BuildConfig.DEBUG ? "debug" : "release")
            + " version=" + BuildConfig.VERSION_NAME + "(" + BuildConfig.VERSION_CODE + ")");
        Log.i(TAG_BRIDGE, "TimeMasterNative登録完了 bridge=" + (getBridge() != null ? "connected" : "missing"));
        logStartupConfiguration();
        createAdContainer();
        requestConsentAndInitializeAds();
    }

    /** Requests fresh consent information at every app startup and on debug refresh. */
    public void requestConsentAndInitializeAds() {
        if (!BuildConfig.ADS_ENABLED) {
            lastAdEvent = "disabled";
            lastUmpEvent = "disabled";
            Log.i(TAG_ADS, "広告無効: release用AdMob IDが未設定です");
            return;
        }
        if (consentUpdateInProgress) {
            Log.d(TAG_UMP, "UMP同意情報更新はすでに実行中です");
            return;
        }

        consentUpdateInProgress = true;
        lastUmpEvent = "request_started";
        clearUmpError();
        consentInformation = UserMessagingPlatform.getConsentInformation(this);
        ConsentRequestParameters.Builder parameters = new ConsentRequestParameters.Builder();
        if (BuildConfig.DEBUG) {
            testDeviceHash = BuildConfig.UMP_TEST_DEVICE_HASHED_ID.isEmpty()
                ? calculateTestDeviceHash()
                : BuildConfig.UMP_TEST_DEVICE_HASHED_ID;
            ConsentDebugSettings.Builder debugSettingsBuilder = new ConsentDebugSettings.Builder(this)
                .setDebugGeography(ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA);
            if (!testDeviceHash.isEmpty()) {
                debugSettingsBuilder.addTestDeviceHashedId(testDeviceHash);
                Log.i(TAG_UMP, "UMPテストデバイスハッシュ=" + testDeviceHash + " EEA強制=true");
            } else {
                Log.w(TAG_UMP, "UMPテストデバイスハッシュを算出できませんでした。SDKのLogcat出力を確認してください");
            }
            parameters.setConsentDebugSettings(debugSettingsBuilder.build());
        }

        Log.i(TAG_UMP, "requestConsentInfoUpdate開始");
        consentInformation.requestConsentInfoUpdate(
            this,
            parameters.build(),
            () -> {
                consentUpdateInProgress = false;
                lastUmpEvent = "request_succeeded";
                logConsentState("requestConsentInfoUpdate成功");
                lastUmpEvent = "consent_form_check_started";
                Log.i(TAG_UMP, "loadAndShowConsentFormIfRequired開始");
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                    this,
                    formError -> {
                        if (formError != null) {
                            recordUmpError("loadAndShowConsentFormIfRequired失敗", formError);
                        } else {
                            lastUmpEvent = "consent_form_completed";
                            Log.i(TAG_UMP, "loadAndShowConsentFormIfRequired完了");
                        }
                        boolean canRequestAds = consentInformation.canRequestAds();
                        Log.i(TAG_UMP, "canRequestAds=" + canRequestAds
                            + " privacyOptionsRequirementStatus=" + getPrivacyOptionsStatus());
                        if (canRequestAds) {
                            initializeMobileAds();
                        } else if (BuildConfig.DEBUG) {
                            Log.w(TAG_UMP, "debug公式テスト広告のためUMP gateを迂回してSDKを初期化します");
                            initializeMobileAds();
                        } else {
                            hideBanner();
                        }
                    }
                );
            },
            formError -> {
                consentUpdateInProgress = false;
                recordUmpError("requestConsentInfoUpdate失敗", formError);
                if (BuildConfig.DEBUG) {
                    Log.w(TAG_UMP, "debug公式テスト広告のためUMP更新失敗後もSDKを初期化します");
                    initializeMobileAds();
                } else {
                    hideBanner();
                }
            }
        );
    }

    private void initializeMobileAds() {
        if (!BuildConfig.ADS_ENABLED) return;
        if (adsInitialized) {
            loadBannerIfRequested();
            return;
        }
        if (adsInitializationStarted) return;

        adsInitializationStarted = true;
        lastAdEvent = "mobile_ads_initializing";
        Log.i(TAG_ADS, "MobileAds初期化開始 mode=" + getAdMobMode());
        try {
            MobileAds.initialize(this, initializationStatus -> runOnUiThread(() -> {
                adsInitialized = true;
                lastAdEvent = "mobile_ads_initialized";
                Log.i(TAG_ADS, "MobileAds初期化完了 adapters="
                    + initializationStatus.getAdapterStatusMap().keySet());
                loadBannerIfRequested();
            }));
        } catch (RuntimeException error) {
            adsInitializationStarted = false;
            lastAdEvent = "mobile_ads_initialization_failed";
            lastAdErrorMessage = error.getClass().getSimpleName() + ": " + safe(error.getMessage());
            Log.e(TAG_ADS, "MobileAds初期化失敗 " + lastAdErrorMessage, error);
        }
    }

    private void createAdContainer() {
        adContainer = new FrameLayout(this);
        adContainer.setVisibility(View.GONE);
        adContainer.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        adContainer.addOnLayoutChangeListener((view, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
            if ((right - left) != (oldRight - oldLeft) || (bottom - top) != (oldBottom - oldTop)) {
                logAdContainerState("広告コンテナlayout変更");
            }
        });
        ViewCompat.setOnApplyWindowInsetsListener(adContainer, (view, windowInsets) -> {
            bottomSystemInsetPx = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
            view.setPadding(0, 0, 0, bottomSystemInsetPx);
            if (view.getVisibility() == View.VISIBLE) {
                notifyBannerVisibility(true, getReservedBannerHeightDp());
            }
            Log.i(TAG_ADS, "system bar bottom inset=" + bottomSystemInsetPx + "px");
            return windowInsets;
        });
        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM
        );
        addContentView(adContainer, layoutParams);
        ViewCompat.requestApplyInsets(adContainer);
        Log.i(TAG_ADS, "バナーコンテナをdecorViewへaddContentViewしました parent=FrameLayout gravity=BOTTOM");
    }

    public void setBannerRequested(boolean shouldShow, String screen) {
        currentScreen = screen == null || screen.isEmpty() ? "unknown" : screen;
        bannerRequested = shouldShow;
        Log.i(TAG_BRIDGE, "画面状態通知 currentScreen=" + currentScreen + " shouldShowAd=" + shouldShow);
        if (!shouldShow) {
            hideBanner();
            return;
        }
        lastAdEvent = "show_requested";
        Log.i(TAG_ADS, "バナー表示命令 currentScreen=" + currentScreen);
        loadBannerIfRequested();
    }

    private void loadBannerIfRequested() {
        if (!bannerRequested || adContainer == null || adView != null) return;
        if (!adsInitialized) {
            lastAdEvent = "waiting_for_mobile_ads";
            Log.i(TAG_ADS, "バナー表示待機: MobileAds初期化前 currentScreen=" + currentScreen);
            return;
        }
        if (BuildConfig.ADMOB_BANNER_AD_UNIT_ID.isEmpty()) {
            lastAdEvent = "missing_banner_id";
            lastAdErrorMessage = "Banner Ad Unit ID is empty";
            Log.e(TAG_ADS, lastAdErrorMessage);
            return;
        }

        lastAdLoadRequestScreen = currentScreen;
        clearAdError();
        AdView nextAdView = new AdView(this);
        nextAdView.setAdUnitId(BuildConfig.ADMOB_BANNER_AD_UNIT_ID);
        nextAdView.setAdSize(getAdaptiveAdSize());
        Log.i(TAG_ADS, "AdView作成 unitId=" + nextAdView.getAdUnitId() + " size=" + nextAdView.getAdSize());
        nextAdView.setAdListener(new AdListener() {
            @Override
            public void onAdLoaded() {
                if (nextAdView != adView || !bannerRequested) return;
                lastAdEvent = "loaded";
                clearAdError();
                adContainer.setVisibility(View.VISIBLE);
                adContainer.bringToFront();
                adContainer.post(() -> {
                    logAdContainerState("バナー広告ロード成功・表示");
                    notifyBannerVisibility(true, getReservedBannerHeightDp());
                });
                Log.i(TAG_ADS, "バナー広告ロード成功 currentScreen=" + currentScreen);
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError adError) {
                if (nextAdView != adView) return;
                lastAdEvent = "load_failed";
                lastAdErrorCode = adError.getCode();
                lastAdErrorDomain = adError.getDomain();
                lastAdErrorMessage = adError.getMessage();
                Log.e(TAG_ADS, "バナー広告ロード失敗 code=" + lastAdErrorCode
                    + " domain=" + lastAdErrorDomain + " message=" + lastAdErrorMessage);
                hideBannerInternal(false);
            }

            @Override
            public void onAdImpression() {
                lastAdEvent = "impression";
                Log.i(TAG_ADS, "バナー広告impression");
            }
        });

        adView = nextAdView;
        adContainer.removeAllViews();
        adContainer.addView(nextAdView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM
        ));
        adContainer.bringToFront();
        lastAdEvent = "load_started";
        Log.i(TAG_ADS, "AdViewをコンテナへaddView childCount=" + adContainer.getChildCount());
        Log.i(TAG_ADS, "AdView.loadAd開始 screen=" + lastAdLoadRequestScreen
            + " unitId=" + nextAdView.getAdUnitId());
        nextAdView.loadAd(new AdRequest.Builder().build());
    }

    private AdSize getAdaptiveAdSize() {
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        int widthDp = Math.round(metrics.widthPixels / metrics.density);
        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, widthDp);
    }

    private int getReservedBannerHeightDp() {
        if (adView == null) return 0;
        float density = getResources().getDisplayMetrics().density;
        return Math.max(50, Math.round((adView.getHeight() + bottomSystemInsetPx) / density));
    }

    public void hideBanner() {
        hideBannerInternal(true);
    }

    private void hideBannerInternal(boolean recordEvent) {
        if (adContainer == null) return;
        if (adView != null) {
            adView.destroy();
            adView = null;
        }
        adContainer.removeAllViews();
        adContainer.setVisibility(View.GONE);
        if (recordEvent) lastAdEvent = "hidden";
        notifyBannerVisibility(false, 0);
        logAdContainerState("広告非表示");
    }

    public void reloadTestBanner(ActionCallback callback) {
        if (!BuildConfig.DEBUG) {
            callback.onResult(false, "テスト広告の再読み込みはdebugビルド限定です。");
            return;
        }
        Log.i(TAG_ADS, "ネイティブ単体テスト広告ロード要求 UMP gate bypass=true");
        currentScreen = "debug_diagnostic_reload";
        bannerRequested = true;
        hideBannerInternal(false);
        lastAdEvent = "diagnostic_reload_requested";
        initializeMobileAds();
        loadBannerIfRequested();
        callback.onResult(true, "Google公式テストバナーのネイティブ単体ロードを開始しました。");
    }

    public void showBannerForDiagnostics(ActionCallback callback) {
        if (!BuildConfig.DEBUG) {
            callback.onResult(false, "広告診断はdebugビルド限定です。");
            return;
        }
        setBannerRequested(true, "debug_diagnostic_show");
        callback.onResult(true, "広告表示を要求しました。状態欄を更新して確認してください。");
    }

    public void hideBannerForDiagnostics(ActionCallback callback) {
        if (!BuildConfig.DEBUG) {
            callback.onResult(false, "広告診断はdebugビルド限定です。");
            return;
        }
        setBannerRequested(false, "debug_diagnostic_hide");
        callback.onResult(true, "広告を非表示にしました。");
    }

    public void runAdSdkDiagnostics(ActionCallback callback) {
        if (!BuildConfig.DEBUG) {
            callback.onResult(false, "広告SDK診断はdebugビルド限定です。");
            return;
        }
        Log.i(TAG_ADS, "広告SDK診断開始");
        logAdContainerState("広告SDK診断");
        if (!adsInitialized) {
            initializeMobileAds();
            callback.onResult(false, "MobileAdsを初期化しています。完了後にもう一度押してください。");
            return;
        }
        MobileAds.openAdInspector(this, inspectorError -> runOnUiThread(() -> {
            if (inspectorError == null) {
                lastAdEvent = "ad_inspector_closed";
                Log.i(TAG_ADS, "広告インスペクタを正常に閉じました");
                callback.onResult(true, "広告インスペクタを閉じました。");
            } else {
                lastAdEvent = "ad_inspector_failed";
                lastAdErrorCode = inspectorError.getCode();
                lastAdErrorDomain = inspectorError.getDomain();
                lastAdErrorMessage = inspectorError.getMessage();
                Log.e(TAG_ADS, "広告インスペクタ失敗 code=" + lastAdErrorCode
                    + " domain=" + lastAdErrorDomain + " message=" + lastAdErrorMessage);
                callback.onResult(false, "広告SDK診断エラー（" + lastAdErrorCode + "）: " + lastAdErrorMessage);
            }
        }));
    }

    public void refreshConsentForTesting(ActionCallback callback) {
        if (!BuildConfig.DEBUG) {
            callback.onResult(false, "UMP再取得はdebugビルド限定です。");
            return;
        }
        if (consentUpdateInProgress) {
            callback.onResult(false, "UMP状態は現在更新中です。");
            return;
        }
        requestConsentAndInitializeAds();
        callback.onResult(true, "UMP状態の再取得を開始しました。");
    }

    public void showPrivacyOptions(ActionCallback callback) {
        Log.i(TAG_BRIDGE, "プライバシー設定ボタン押下をネイティブで受信");
        if (!BuildConfig.ADS_ENABLED || consentInformation == null) {
            String message = "広告・同意機能が未初期化のため、プライバシー設定を表示できません。";
            Log.w(TAG_UMP, message);
            callback.onResult(false, message);
            return;
        }

        ConsentInformation.PrivacyOptionsRequirementStatus requirementStatus =
            consentInformation.getPrivacyOptionsRequirementStatus();
        Log.i(TAG_UMP, "privacyOptionsRequirementStatus=" + getPrivacyOptionsStatus());
        if (requirementStatus != ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED) {
            String message;
            if (lastUmpErrorCode >= 0) {
                message = formatUmpErrorForUser();
            } else if (requirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.NOT_REQUIRED) {
                message = "現在、この地域では追加のプライバシー設定は必要ありません。";
            } else {
                message = "プライバシー設定の状態を確認中です。しばらくしてからもう一度お試しください。";
            }
            Log.i(TAG_UMP, "プライバシー設定フォーム非表示: " + message);
            callback.onResult(false, message);
            return;
        }

        lastUmpEvent = "privacy_options_form_started";
        Log.i(TAG_UMP, "showPrivacyOptionsForm開始");
        UserMessagingPlatform.showPrivacyOptionsForm(this, formError -> {
            if (formError != null) {
                recordUmpError("showPrivacyOptionsForm失敗", formError);
                callback.onResult(false, formatUmpErrorForUser());
                return;
            }
            lastUmpEvent = "privacy_options_form_succeeded";
            Log.i(TAG_UMP, "showPrivacyOptionsForm成功");
            callback.onResult(true, "プライバシー設定を表示しました。");
        });
    }

    public void resetConsentForTesting(ActionCallback callback) {
        if (!BuildConfig.DEBUG) {
            callback.onResult(false, "同意状態のリセットはdebugビルド限定です。");
            return;
        }
        if (consentInformation == null) {
            consentInformation = UserMessagingPlatform.getConsentInformation(this);
        }
        Log.i(TAG_UMP, "debug同意状態リセット");
        consentInformation.reset();
        clearUmpError();
        consentUpdateInProgress = false;
        requestConsentAndInitializeAds();
        callback.onResult(true, "同意状態をリセットし、UMP情報を再取得しています。");
    }

    public JSObject getDebugInfo() {
        JSObject result = new JSObject();
        result.put("debug", BuildConfig.DEBUG);
        result.put("buildType", BuildConfig.DEBUG ? "debug" : "release");
        result.put("appVersion", BuildConfig.VERSION_NAME + " (" + BuildConfig.VERSION_CODE + ")");
        result.put("adMobMode", getAdMobMode());
        result.put("appIdConfigured", !BuildConfig.ADMOB_APP_ID.isEmpty() && !manifestAdMobAppId.isEmpty());
        result.put("bannerIdConfigured", !BuildConfig.ADMOB_BANNER_AD_UNIT_ID.isEmpty());
        result.put("adMobAppId", BuildConfig.ADMOB_APP_ID);
        result.put("manifestAdMobAppId", manifestAdMobAppId);
        result.put("bannerAdUnitId", BuildConfig.ADMOB_BANNER_AD_UNIT_ID);
        result.put("mobileAdsInitialized", adsInitialized);
        result.put("consentStatus", getConsentStatus());
        result.put("canRequestAds", consentInformation != null && consentInformation.canRequestAds());
        result.put("privacyOptionsRequired", getPrivacyOptionsStatus());
        result.put("lastAdLoadRequestScreen", lastAdLoadRequestScreen);
        result.put("lastAdEvent", lastAdEvent);
        result.put("lastAdErrorCode", lastAdErrorCode);
        result.put("lastAdErrorDomain", lastAdErrorDomain);
        result.put("lastAdErrorMessage", lastAdErrorMessage);
        result.put("lastUmpEvent", lastUmpEvent);
        result.put("lastUmpErrorCode", lastUmpErrorCode);
        result.put("lastUmpErrorMessage", lastUmpErrorMessage);
        result.put("nativeBridgeStatus", getBridge() != null ? "connected" : "missing");
        result.put("currentScreen", currentScreen);
        result.put("shouldShowAd", bannerRequested);
        result.put("adContainerWidth", adContainer == null ? -1 : adContainer.getWidth());
        result.put("adContainerHeight", adContainer == null ? -1 : adContainer.getHeight());
        result.put("adContainerVisibility", getAdContainerVisibility());
        result.put("adViewAttached", adView != null && adView.getParent() == adContainer);
        result.put("adViewUnitId", adView == null ? "" : safe(adView.getAdUnitId()));
        result.put("testDeviceHash", testDeviceHash);
        Log.i(TAG_BRIDGE, "getDebugInfo応答 currentScreen=" + currentScreen
            + " shouldShowAd=" + bannerRequested + " lastAdEvent=" + lastAdEvent);
        return result;
    }

    private void logStartupConfiguration() {
        try {
            ApplicationInfo applicationInfo = getPackageManager().getApplicationInfo(
                getPackageName(), PackageManager.GET_META_DATA);
            if (applicationInfo.metaData != null) {
                manifestAdMobAppId = safe(applicationInfo.metaData.getString(
                    "com.google.android.gms.ads.APPLICATION_ID"));
            }
        } catch (PackageManager.NameNotFoundException error) {
            Log.e(TAG_APP, "AndroidManifestのAdMob App ID確認失敗", error);
        }
        Log.i(TAG_APP, "AndroidManifest AdMob App ID="
            + (manifestAdMobAppId.isEmpty() ? "未設定" : manifestAdMobAppId));
        Log.i(TAG_ADS, "広告設定 mode=" + getAdMobMode()
            + " BuildConfigAppId=" + BuildConfig.ADMOB_APP_ID
            + " BannerUnitId=" + BuildConfig.ADMOB_BANNER_AD_UNIT_ID
            + " SDK=play-services-ads:25.4.0 UMP=4.0.0");
    }

    private String calculateTestDeviceHash() {
        String androidId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        if (androidId == null || androidId.isEmpty()) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] bytes = digest.digest(androidId.getBytes(StandardCharsets.UTF_8));
            StringBuilder value = new StringBuilder();
            for (byte item : bytes) value.append(String.format(Locale.US, "%02X", item & 0xff));
            return value.toString();
        } catch (Exception error) {
            Log.e(TAG_UMP, "UMPテストデバイスハッシュ算出失敗", error);
            return "";
        }
    }

    private String getAdMobMode() {
        if (!BuildConfig.ADS_ENABLED) return "disabled";
        return BuildConfig.DEBUG ? "test" : "production";
    }

    private String getConsentStatus() {
        if (consentInformation == null) return "unknown";
        int status = consentInformation.getConsentStatus();
        if (status == ConsentInformation.ConsentStatus.REQUIRED) return "required";
        if (status == ConsentInformation.ConsentStatus.NOT_REQUIRED) return "not_required";
        if (status == ConsentInformation.ConsentStatus.OBTAINED) return "obtained";
        return "unknown";
    }

    private String getPrivacyOptionsStatus() {
        if (consentInformation == null) return "unknown";
        ConsentInformation.PrivacyOptionsRequirementStatus status =
            consentInformation.getPrivacyOptionsRequirementStatus();
        if (status == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED) return "true";
        if (status == ConsentInformation.PrivacyOptionsRequirementStatus.NOT_REQUIRED) return "false";
        return "unknown";
    }

    private void logConsentState(String prefix) {
        Log.i(TAG_UMP, prefix + " consentStatus=" + getConsentStatus()
            + " canRequestAds=" + consentInformation.canRequestAds()
            + " privacyOptionsRequirementStatus=" + getPrivacyOptionsStatus());
    }

    private void recordUmpError(String prefix, FormError formError) {
        lastUmpEvent = "error";
        lastUmpErrorCode = formError.getErrorCode();
        lastUmpErrorMessage = formError.getMessage();
        Log.e(TAG_UMP, prefix + " code=" + lastUmpErrorCode + " message=" + lastUmpErrorMessage);
    }

    private String formatUmpErrorForUser() {
        return "UMPエラー（コード " + lastUmpErrorCode + "）: " + lastUmpErrorMessage
            + "。通信状態、AdMobアプリID、プライバシーメッセージ設定を確認してください。";
    }

    private void clearUmpError() {
        lastUmpErrorCode = -1;
        lastUmpErrorMessage = "";
    }

    private void clearAdError() {
        lastAdErrorCode = -1;
        lastAdErrorDomain = "";
        lastAdErrorMessage = "";
    }

    private String getAdContainerVisibility() {
        if (adContainer == null) return "missing";
        if (adContainer.getVisibility() == View.VISIBLE) return "VISIBLE";
        if (adContainer.getVisibility() == View.INVISIBLE) return "INVISIBLE";
        return "GONE";
    }

    private void logAdContainerState(String prefix) {
        Log.i(TAG_ADS, prefix + " width=" + (adContainer == null ? -1 : adContainer.getWidth())
            + " height=" + (adContainer == null ? -1 : adContainer.getHeight())
            + " visibility=" + getAdContainerVisibility()
            + " childCount=" + (adContainer == null ? -1 : adContainer.getChildCount())
            + " adViewAttached=" + (adView != null && adView.getParent() == adContainer)
            + " unitId=" + (adView == null ? "none" : safe(adView.getAdUnitId())));
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private void notifyBannerVisibility(boolean visible, int heightDp) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        String script = "window.dispatchEvent(new CustomEvent('" + BANNER_VISIBILITY_EVENT
            + "', {detail:{visible:" + (visible ? "true" : "false")
            + ",height:" + Math.max(0, heightDp) + "}}));";
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(script, null));
    }

    @Override
    public void onDestroy() {
        hideBanner();
        Log.i(TAG_APP, "アプリ終了");
        super.onDestroy();
    }

    public interface ActionCallback {
        void onResult(boolean succeeded, String message);
    }
}
