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
        String screen = call.getString("screen", "unknown");
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからshowBannerを受信 screen=" + screen);
        runOnMainActivity(activity -> activity.setBannerRequested(true, screen), call);
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        String screen = call.getString("screen", "unknown");
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからhideBannerを受信 screen=" + screen);
        runOnMainActivity(activity -> activity.setBannerRequested(false, screen), call);
    }

    @PluginMethod
    public void showPrivacyOptions(PluginCall call) {
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからshowPrivacyOptionsを受信");
        MainActivity activity = getMainActivity(call);
        if (activity == null) return;
        activity.runOnUiThread(() -> activity.showPrivacyOptions((succeeded, message) ->
            resolveAction(call, succeeded, message)));
    }

    @PluginMethod
    public void getDebugInfo(PluginCall call) {
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからgetDebugInfoを受信");
        MainActivity activity = getMainActivity(call);
        if (activity == null) return;
        activity.runOnUiThread(() -> call.resolve(activity.getDebugInfo()));
    }

    @PluginMethod
    public void reloadTestBanner(PluginCall call) {
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからreloadTestBannerを受信");
        runAction(call, MainActivity::reloadTestBanner);
    }

    @PluginMethod
    public void showAdForDiagnostics(PluginCall call) {
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからshowAdForDiagnosticsを受信");
        runAction(call, MainActivity::showBannerForDiagnostics);
    }

    @PluginMethod
    public void hideAdForDiagnostics(PluginCall call) {
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからhideAdForDiagnosticsを受信");
        runAction(call, MainActivity::hideBannerForDiagnostics);
    }

    @PluginMethod
    public void runAdSdkDiagnostics(PluginCall call) {
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからrunAdSdkDiagnosticsを受信");
        runAction(call, MainActivity::runAdSdkDiagnostics);
    }

    @PluginMethod
    public void refreshUmpState(PluginCall call) {
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからrefreshUmpStateを受信");
        runAction(call, MainActivity::refreshConsentForTesting);
    }

    @PluginMethod
    public void resetConsentForTesting(PluginCall call) {
        Log.i(MainActivity.TAG_BRIDGE, "WebViewからresetConsentForTestingを受信");
        runAction(call, MainActivity::resetConsentForTesting);
    }

    private MainActivity getMainActivity(PluginCall call) {
        Activity currentActivity = getActivity();
        if (currentActivity instanceof MainActivity) {
            return (MainActivity) currentActivity;
        }
        Log.e(MainActivity.TAG_BRIDGE, "MainActivity取得失敗 currentActivity=" + currentActivity);
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

    private void runAction(PluginCall call, MainActivityCallbackAction action) {
        MainActivity activity = getMainActivity(call);
        if (activity == null) return;
        activity.runOnUiThread(() -> action.run(activity, (succeeded, message) ->
            resolveAction(call, succeeded, message)));
    }

    private void resolveAction(PluginCall call, boolean succeeded, String message) {
        JSObject result = new JSObject();
        result.put("opened", succeeded);
        result.put("message", message);
        call.resolve(result);
    }

    private interface MainActivityAction {
        void run(MainActivity activity);
    }

    private interface MainActivityCallbackAction {
        void run(MainActivity activity, MainActivity.ActionCallback callback);
    }
}
