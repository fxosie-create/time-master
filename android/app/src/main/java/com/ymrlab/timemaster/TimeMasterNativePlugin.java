package com.ymrlab.timemaster;

import android.app.Activity;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Small bridge that keeps native ads and consent out of the web/PWA build. */
@CapacitorPlugin(name = "TimeMasterNative")
public class TimeMasterNativePlugin extends Plugin {
    @PluginMethod
    public void showBanner(PluginCall call) {
        runOnMainActivity(activity -> activity.setBannerRequested(true), call);
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        runOnMainActivity(activity -> activity.setBannerRequested(false), call);
    }

    @PluginMethod
    public void showPrivacyOptions(PluginCall call) {
        runOnMainActivity(MainActivity::showPrivacyOptions, call);
    }

    private void runOnMainActivity(MainActivityAction action, PluginCall call) {
        Activity currentActivity = getActivity();
        if (!(currentActivity instanceof MainActivity)) {
            call.resolve();
            return;
        }
        currentActivity.runOnUiThread(() -> {
            action.run((MainActivity) currentActivity);
            call.resolve();
        });
    }

    private interface MainActivityAction {
        void run(MainActivity activity);
    }
}
