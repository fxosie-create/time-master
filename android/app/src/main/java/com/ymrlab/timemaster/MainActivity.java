package com.ymrlab.timemaster;

import android.os.Bundle;
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

/** Hosts the offline Capacitor application and the native-only test/production banner. */
public class MainActivity extends BridgeActivity {
    public static final String TAG_ADS = "TimeMasterAds";
    public static final String TAG_UMP = "TimeMasterUMP";
    public static final String TAG_APP = "TimeMasterApp";
    private static final String BANNER_VISIBILITY_EVENT = "time-master-native-banner-visibility";

    private FrameLayout adContainer;
    private AdView adView;
    private ConsentInformation consentInformation;
    private boolean adsInitializationStarted;
    private boolean adsInitialized;
    private boolean bannerRequested;
    private boolean consentUpdateInProgress;
    private int bottomSystemInsetPx;
    private String lastAdEvent = "not_started";
    private int lastAdErrorCode = -1;
    private String lastAdErrorMessage = "";
    private String lastUmpError = "";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG_APP, "アプリ起動 build=" + (BuildConfig.DEBUG ? "debug" : "release"));
        registerPlugin(TimeMasterNativePlugin.class);
        createAdContainer();
        requestConsentAndInitializeAds();
    }

    /** Requests fresh consent information at every app startup. */
    public void requestConsentAndInitializeAds() {
        if (!BuildConfig.ADS_ENABLED) {
            lastAdEvent = "disabled";
            Log.i(TAG_ADS, "広告無効: release用AdMob IDが未設定です");
            return;
        }
        if (consentUpdateInProgress) {
            Log.d(TAG_UMP, "UMP同意情報更新はすでに実行中です");
            return;
        }

        consentUpdateInProgress = true;
        lastUmpError = "";
        consentInformation = UserMessagingPlatform.getConsentInformation(this);
        ConsentRequestParameters.Builder parameters = new ConsentRequestParameters.Builder();
        if (BuildConfig.DEBUG) {
            ConsentDebugSettings.Builder debugSettingsBuilder = new ConsentDebugSettings.Builder(this)
                .setDebugGeography(ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA);
            if (!BuildConfig.UMP_TEST_DEVICE_HASHED_ID.isEmpty()) {
                debugSettingsBuilder.addTestDeviceHashedId(BuildConfig.UMP_TEST_DEVICE_HASHED_ID);
                Log.i(TAG_UMP, "UMPテスト端末ハッシュを設定しました");
            } else {
                Log.i(TAG_UMP, "UMP debug: EEA地域を強制。実機ではLogcatの端末ハッシュをGradle設定へ追加できます");
            }
            parameters.setConsentDebugSettings(debugSettingsBuilder.build());
        }

        Log.i(TAG_UMP, "UMP同意情報更新開始");
        consentInformation.requestConsentInfoUpdate(
            this,
            parameters.build(),
            () -> {
                consentUpdateInProgress = false;
                logConsentState("UMP同意情報更新成功");
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                    this,
                    formError -> {
                        if (formError != null) {
                            recordUmpError("UMP同意フォーム表示失敗", formError);
                        } else {
                            Log.i(TAG_UMP, "UMP同意フォーム処理完了");
                        }
                        boolean canRequestAds = consentInformation.canRequestAds();
                        Log.i(TAG_UMP, "canRequestAds=" + canRequestAds);
                        if (canRequestAds) {
                            initializeMobileAds();
                        } else if (BuildConfig.DEBUG) {
                            Log.w(TAG_UMP, "debug公式テスト広告のためUMP未完了時フォールバックを使用します");
                            initializeMobileAds();
                        } else {
                            hideBanner();
                        }
                    }
                );
            },
            formError -> {
                consentUpdateInProgress = false;
                recordUmpError("UMP同意情報更新失敗", formError);
                if (BuildConfig.DEBUG) {
                    Log.w(TAG_UMP, "debug公式テスト広告のためUMP更新失敗時フォールバックを使用します");
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
        MobileAds.initialize(this, initializationStatus -> runOnUiThread(() -> {
            adsInitialized = true;
            lastAdEvent = "mobile_ads_initialized";
            Log.i(TAG_ADS, "MobileAds初期化完了");
            loadBannerIfRequested();
        }));
    }

    private void createAdContainer() {
        adContainer = new FrameLayout(this);
        adContainer.setVisibility(View.GONE);
        adContainer.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        ViewCompat.setOnApplyWindowInsetsListener(adContainer, (view, windowInsets) -> {
            bottomSystemInsetPx = windowInsets
                .getInsets(WindowInsetsCompat.Type.systemBars())
                .bottom;
            view.setPadding(0, 0, 0, bottomSystemInsetPx);
            if (view.getVisibility() == View.VISIBLE) {
                notifyBannerVisibility(true, getReservedBannerHeightDp());
            }
            return windowInsets;
        });
        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM
        );
        addContentView(adContainer, layoutParams);
        ViewCompat.requestApplyInsets(adContainer);
        Log.i(TAG_ADS, "バナーコンテナを画面下部へ追加しました");
    }

    public void setBannerRequested(boolean shouldShow) {
        bannerRequested = shouldShow;
        Log.i(TAG_APP, "画面遷移時の広告表示対象=" + shouldShow);
        if (!shouldShow) {
            hideBanner();
            return;
        }
        lastAdEvent = "show_requested";
        Log.i(TAG_ADS, "バナー表示命令を受信しました");
        loadBannerIfRequested();
    }

    private void loadBannerIfRequested() {
        if (!bannerRequested || adContainer == null || adView != null) return;
        if (!adsInitialized) {
            lastAdEvent = "waiting_for_mobile_ads";
            Log.i(TAG_ADS, "バナー表示待機: MobileAds初期化前です");
            return;
        }
        if (BuildConfig.ADMOB_BANNER_AD_UNIT_ID.isEmpty()) {
            lastAdEvent = "missing_banner_id";
            lastAdErrorMessage = "Banner Ad Unit ID is empty";
            Log.e(TAG_ADS, lastAdErrorMessage);
            return;
        }

        AdView nextAdView = new AdView(this);
        nextAdView.setAdUnitId(BuildConfig.ADMOB_BANNER_AD_UNIT_ID);
        nextAdView.setAdSize(getAdaptiveAdSize());
        nextAdView.setAdListener(new AdListener() {
            @Override
            public void onAdLoaded() {
                if (nextAdView != adView || !bannerRequested) return;
                lastAdEvent = "loaded";
                lastAdErrorCode = -1;
                lastAdErrorMessage = "";
                adContainer.setVisibility(View.VISIBLE);
                adContainer.bringToFront();
                adContainer.post(() -> notifyBannerVisibility(true, getReservedBannerHeightDp()));
                Log.i(TAG_ADS, "バナー広告ロード成功");
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError adError) {
                if (nextAdView != adView) return;
                lastAdEvent = "load_failed";
                lastAdErrorCode = adError.getCode();
                lastAdErrorMessage = adError.getMessage();
                Log.e(
                    TAG_ADS,
                    "バナー広告ロード失敗 code=" + lastAdErrorCode
                        + " message=" + lastAdErrorMessage
                );
                hideBannerInternal(false);
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
        Log.i(TAG_ADS, "バナー広告ロード開始 size=" + nextAdView.getAdSize());
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
        Log.i(TAG_ADS, "広告非表示処理");
    }

    public void showPrivacyOptions(PrivacyOptionsCallback callback) {
        Log.i(TAG_APP, "プライバシー設定ボタン押下");
        if (!BuildConfig.ADS_ENABLED || consentInformation == null) {
            String message = "現在は広告・同意機能が無効なため、プライバシー設定を表示できません。";
            Log.w(TAG_UMP, message);
            callback.onResult(false, message);
            return;
        }

        ConsentInformation.PrivacyOptionsRequirementStatus requirementStatus =
            consentInformation.getPrivacyOptionsRequirementStatus();
        Log.i(TAG_UMP, "privacyOptionsRequirementStatus=" + getPrivacyOptionsStatus());
        if (requirementStatus != ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED) {
            String message;
            if (!lastUmpError.isEmpty()) {
                message = BuildConfig.DEBUG
                    ? "現在はテスト環境のため、AdMobのプライバシーメッセージを利用できません。デバッグ情報とLogcatを確認してください。"
                    : "プライバシー設定を読み込めませんでした。通信状態を確認して、もう一度お試しください。";
            } else if (requirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.NOT_REQUIRED) {
                message = "現在、この地域では追加のプライバシー設定は必要ありません。";
            } else {
                message = "プライバシー設定の状態を確認中です。しばらくしてから、もう一度お試しください。";
            }
            Log.i(TAG_UMP, "プライバシー設定フォーム非表示: " + message);
            callback.onResult(false, message);
            return;
        }

        Log.i(TAG_UMP, "プライバシー設定フォーム表示開始");
        UserMessagingPlatform.showPrivacyOptionsForm(this, formError -> {
            if (formError != null) {
                recordUmpError("プライバシー設定フォーム表示失敗", formError);
                callback.onResult(
                    false,
                    "プライバシー設定を読み込めませんでした。通信状態を確認して、もう一度お試しください。"
                );
                return;
            }
            Log.i(TAG_UMP, "プライバシー設定フォーム表示成功");
            callback.onResult(true, "プライバシー設定を表示しました。");
        });
    }

    public void resetConsentForTesting(PrivacyOptionsCallback callback) {
        if (!BuildConfig.DEBUG) {
            callback.onResult(false, "同意状態のリセットはdebugビルド限定です。");
            return;
        }
        if (consentInformation == null) {
            consentInformation = UserMessagingPlatform.getConsentInformation(this);
        }
        Log.i(TAG_UMP, "debug同意状態リセット");
        consentInformation.reset();
        lastUmpError = "";
        requestConsentAndInitializeAds();
        callback.onResult(true, "同意状態をリセットし、UMP情報を再取得しています。");
    }

    public JSObject getDebugInfo() {
        JSObject result = new JSObject();
        result.put("debug", BuildConfig.DEBUG);
        result.put("buildType", BuildConfig.DEBUG ? "debug" : "release");
        result.put("adMobMode", getAdMobMode());
        result.put("appIdConfigured", !BuildConfig.ADMOB_APP_ID.isEmpty());
        result.put("bannerIdConfigured", !BuildConfig.ADMOB_BANNER_AD_UNIT_ID.isEmpty());
        result.put("mobileAdsInitialized", adsInitialized);
        result.put("consentStatus", getConsentStatus());
        result.put("canRequestAds", consentInformation != null && consentInformation.canRequestAds());
        result.put("privacyOptionsRequired", getPrivacyOptionsStatus());
        result.put("lastAdEvent", lastAdEvent);
        result.put("lastAdErrorCode", lastAdErrorCode);
        result.put("lastAdErrorMessage", lastAdErrorMessage);
        result.put("lastUmpError", lastUmpError);
        result.put("currentScreenAdEligible", bannerRequested);
        return result;
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
        Log.i(
            TAG_UMP,
            prefix
                + " consentStatus=" + getConsentStatus()
                + " canRequestAds=" + consentInformation.canRequestAds()
                + " privacyOptionsRequirementStatus=" + getPrivacyOptionsStatus()
        );
    }

    private void recordUmpError(String prefix, FormError formError) {
        lastUmpError = "code=" + formError.getErrorCode() + " message=" + formError.getMessage();
        Log.e(TAG_UMP, prefix + " " + lastUmpError);
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

    public interface PrivacyOptionsCallback {
        void onResult(boolean opened, String message);
    }
}
