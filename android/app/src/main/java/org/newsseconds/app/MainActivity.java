package org.newsseconds.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public final class MainActivity extends Activity {
  private static final String HOME_URL = "https://news-seconds-api-pages.pages.dev/";

  private WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    webView = new WebView(this);
    webView.setBackgroundColor(Color.rgb(12, 28, 18));
    setContentView(webView);

    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMediaPlaybackRequiresUserGesture(true);

    webView.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if ("https".equals(uri.getScheme()) && isTrustedHost(uri.getHost())) {
          return false;
        }
        startActivity(new Intent(Intent.ACTION_VIEW, uri));
        return true;
      }

      @Override
      public void onReceivedSslError(WebView view, SslErrorHandler handler, android.net.http.SslError error) {
        handler.cancel();
      }
    });

    webView.loadUrl(HOME_URL);
  }

  @Override
  public void onBackPressed() {
    if (webView.canGoBack()) webView.goBack();
    else super.onBackPressed();
  }

  private static boolean isTrustedHost(String host) {
    return "news-seconds-api-pages.pages.dev".equals(host)
        || "news-seconds.duckdns.org".equals(host);
  }
}
