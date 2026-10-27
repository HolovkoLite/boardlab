package it.boardlab.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Le scritte dell'app restano della loro grandezza anche se nelle impostazioni di Android il testo è ingrandito
        getBridge().getWebView().getSettings().setTextZoom(100);
    }
}
