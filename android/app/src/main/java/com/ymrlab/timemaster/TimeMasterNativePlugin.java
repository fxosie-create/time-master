package com.ymrlab.timemaster;

import android.app.Activity;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Bridge that keeps native ads, UMP, and debug state out of the Web/PWA build. */
@CapacitorPlugin(name = "TimeMasterNative")
public class TimeMasterNativePlugin extends Plugin {
    @PluginMethod
    public void showBanner(PluginCall call) {
        Log.i(MainActivity.TAG_APP, "WebViewからshowBannerを受信");
        runOnMainActivity(activity -> activity.setBannerRequested(true), call);
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        Log.i(MainActivity.TAG_APP, "WebViewからhideBannerを受信");
        runOnMainActivity(activity -> activity.setBannerRequested(false), call);
    }

    @PluginMethod
    public void showPrivacyOptions(PluginCall call) {
        MainActivity activity = getMainActivity(call);
        if (activity == null) return;
        activity.runOnUiThread(() -> activity.showPrivacyOptions((opened, message) -> {
            JSObject result = new JSObject();
            result.put("opened", opened);
            result.put("message", message);
            call.resolve(result);
        }));
    }

    @PluginMethod
    public void getDebugInfo(PluginCall call) {
        MainActivity activity = getMainActivity(call);
        if (activity == null) return;
        activity.runOnUiThread(() -> call.resolve(activity.getDebugInfo()));
    }

    @PluginMethod
    public void resetConsentForTesting(PluginCall call) {
        MainActivity activity = getMainActivity(call);
        if (activity == null) return;
        activity.runOnUiThread(() -> activity.resetConsentForTesting((opened, message) -> {
            JSObject result = new JSObject();
            result.put("opened", opened);
            result.put("message", message);
            call.resolve(result);
        }));
    }

    private MainActivity getMainActivity(PluginCall call) {
        Activity currentActivity = getActivity();
        if (currentActivity instanceof MainActivity) {
            return (MainActivity) currentActivity;
        }
        JSObject result = new JSObject();
        result.put("opened", false);
        result.put("message", "Androidネイティブ画面を取得できませんでした。");
        call.resolve(result);
        return null;
    }

    private void runOnMainActivity(MainActivityAction action, PluginCall call) {
        MainActivity activity = getMainActivity(call);
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            action.run(activity);
            call.resolve();
        });
    }

    private interface MainActivityAction {
        void run(MainActivity activity);
    }
}
