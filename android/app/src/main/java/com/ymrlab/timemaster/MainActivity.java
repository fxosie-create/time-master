package com.ymrlab.timemaster;

import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.ump.ConsentDebugSettings;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

/** Hosts the offline Capacitor application and the optional native-only ad banner. */
public class MainActivity extends BridgeActivity {
    private static final String BANNER_VISIBILITY_EVENT = "time-master-native-banner-visibility";

    private FrameLayout adContainer;
    private AdView adView;
    private ConsentInformation consentInformation;
    private boolean adsInitialized;
    private boolean bannerRequested;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(TimeMasterNativePlugin.class);
        createAdContainer();
        requestConsentAndInitializeAds();
    }

    /**
     * Requests consent at every app startup. The Mobile Ads SDK is only initialized after
     * UMP has completed and permits ad requests; an error leaves the app usable without ads.
     */
    private void requestConsentAndInitializeAds() {
        if (!BuildConfig.ADS_ENABLED) {
            return;
        }

        consentInformation = UserMessagingPlatform.getConsentInformation(this);
        ConsentRequestParameters.Builder parameters = new ConsentRequestParameters.Builder();
        if (BuildConfig.DEBUG) {
            ConsentDebugSettings.Builder debugSettingsBuilder = new ConsentDebugSettings.Builder(this)
                .setDebugGeography(ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA);
            if (!BuildConfig.UMP_TEST_DEVICE_HASHED_ID.isEmpty()) {
                debugSettingsBuilder.addTestDeviceHashedId(BuildConfig.UMP_TEST_DEVICE_HASHED_ID);
            }
            ConsentDebugSettings debugSettings = debugSettingsBuilder.build();
            parameters.setConsentDebugSettings(debugSettings);
        }

        consentInformation.requestConsentInfoUpdate(
            this,
            parameters.build(),
            () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                this,
                formError -> {
                    if (consentInformation.canRequestAds()) {
                        initializeMobileAds();
                    }
                }
            ),
            formError -> hideBanner()
        );
    }

    private void initializeMobileAds() {
        if (adsInitialized || !BuildConfig.ADS_ENABLED) {
            if (adsInitialized) {
                loadBannerIfRequested();
            }
            return;
        }

        adsInitialized = true;
        MobileAds.initialize(this, initializationStatus -> loadBannerIfRequested());
    }

    private void createAdContainer() {
        adContainer = new FrameLayout(this);
        adContainer.setVisibility(View.GONE);
        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM
        );
        addContentView(adContainer, layoutParams);
    }

    public void setBannerRequested(boolean shouldShow) {
        bannerRequested = shouldShow;
        if (!shouldShow) {
            hideBanner();
            return;
        }
        loadBannerIfRequested();
    }

    private void loadBannerIfRequested() {
        if (!bannerRequested || !adsInitialized || adContainer == null || adView != null) {
            return;
        }

        AdView nextAdView = new AdView(this);
        nextAdView.setAdUnitId(BuildConfig.ADMOB_BANNER_AD_UNIT_ID);
        nextAdView.setAdSize(getAdaptiveAdSize());
        nextAdView.setAdListener(new AdListener() {
            @Override
            public void onAdLoaded() {
                if (nextAdView != adView || !bannerRequested) {
                    return;
                }
                adContainer.setVisibility(View.VISIBLE);
                adContainer.post(() -> notifyBannerVisibility(true, getBannerHeightDp()));
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError adError) {
                if (nextAdView == adView) {
                    hideBanner();
                }
            }
        });

        adView = nextAdView;
        adContainer.addView(nextAdView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM
        ));
        nextAdView.loadAd(new AdRequest.Builder().build());
    }

    private AdSize getAdaptiveAdSize() {
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        int widthDp = Math.round(metrics.widthPixels / metrics.density);
        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, widthDp);
    }

    private int getBannerHeightDp() {
        if (adView == null) {
            return 0;
        }
        float density = getResources().getDisplayMetrics().density;
        return Math.max(50, Math.round(adView.getHeight() / density));
    }

    public void hideBanner() {
        if (adContainer == null) {
            return;
        }
        if (adView != null) {
            adView.destroy();
            adView = null;
        }
        adContainer.removeAllViews();
        adContainer.setVisibility(View.GONE);
        notifyBannerVisibility(false, 0);
    }

    public void showPrivacyOptions() {
        if (!BuildConfig.ADS_ENABLED || consentInformation == null) {
            return;
        }
        if (consentInformation.getPrivacyOptionsRequirementStatus()
            != ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED) {
            return;
        }
        UserMessagingPlatform.showPrivacyOptionsForm(this, formError -> {
            // The optional privacy form can fail without affecting the game or its saved records.
        });
    }

    private void notifyBannerVisibility(boolean visible, int heightDp) {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        String script = "window.dispatchEvent(new CustomEvent('" + BANNER_VISIBILITY_EVENT
            + "', {detail:{visible:" + (visible ? "true" : "false")
            + ",height:" + Math.max(0, heightDp) + "}}));";
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(script, null));
    }

    @Override
    public void onDestroy() {
        hideBanner();
        super.onDestroy();
    }
}
