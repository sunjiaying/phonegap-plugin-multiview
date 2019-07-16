package phonegap.pgmultiview;

        import android.os.Bundle;
        import org.apache.cordova.CordovaActivity;
        import android.content.Intent;
        import android.app.Activity;
        import org.apache.cordova.PluginEntry;

public class PGMultiViewActivity extends CordovaActivity {

    public String message;

    @Override
    protected void loadConfig() {
        super.loadConfig();
        for(int i=0; i<pluginEntries.size(); i++) {
            PluginEntry pe = pluginEntries.get(i);
            if (pe.service.equals("SplashScreen")) {
                pluginEntries.remove(pe);
            } else if (pe.service.equals("HotCodePush")) {
                pluginEntries.remove(pe);
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Bundle bundle = getIntent().getExtras();
        String url = bundle.getString("start URL");
        message = bundle.getString("Message to child");
        loadUrl(url);
    }

    @Override
    public void onBackPressed() {
        if(appView.canGoBack()){
            appView.backHistory();
        }
        else if(appView.canGoBack()==false) {
            Intent result = new Intent();
            result.putExtra("Message to parent", "");
            this.setResult(Activity.RESULT_OK, result);
            this.finish();
        }}

    public String getMessage() {
        return message;
    }
}

