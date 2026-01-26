import UIKit
import FirebaseCore
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import ChannelIOFront
import NaverThirdPartyLogin

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    // ChannelIO 초기화 (SDK 시그니처에 맞춰 필요시 레이블 추가)
    // 예) ChannelIO.initialize(application: application)
    ChannelIO.initialize(application)

    let delegate = ReactNativeDelegate()
    delegate.dependencyProvider = RCTAppDependencyProvider()
    let factory = RCTReactNativeFactory(delegate: delegate)

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    let window = UIWindow(frame: UIScreen.main.bounds)
    self.window = window

    factory.startReactNative(
      withModuleName: "react_native", // AppRegistry 이름과 동일해야 함
      in: window,
      launchOptions: launchOptions
    )

    window.makeKeyAndVisible()
    return true
  }

  // ⬇️ 이 메서드는 반드시 AppDelegate 클래스 "안"에 있어야 합니다.
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    // Info.plist에 등록한 실제 스킴으로 교체하세요.
    if url.scheme == "naverzUSFUbywPPEhYWwRlsKJ" {
      return NaverThirdPartyLoginConnection.getSharedInstance()
        .application(app, open: url, options: options)
    }
    return false
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
