import UIKit
import FirebaseCore
import FirebaseMessaging
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import ChannelIOFront
import NaverThirdPartyLogin
import KakaoSDKCommon
import KakaoSDKAuth
import FBSDKCoreKit
import FBSDKLoginKit
import AppTrackingTransparency

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {

    // Firebase
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    // Facebook SDK 초기화
    ApplicationDelegate.shared.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )

    UNUserNotificationCenter.current().delegate = self
    Messaging.messaging().delegate = self

    let center = UNUserNotificationCenter.current()
    center.requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
      DispatchQueue.main.async {
        UIApplication.shared.registerForRemoteNotifications()
      }
    }

    // Kakao
    KakaoSDK.initSDK(appKey: "f2d22934a5dfdf9345a6a9b837834bce")

    // ChannelIO (라벨 없이)
    ChannelIO.initialize(application)

    let delegate = ReactNativeDelegate()
    delegate.dependencyProvider = RCTAppDependencyProvider()
    let factory = RCTReactNativeFactory(delegate: delegate)

    self.reactNativeDelegate = delegate
    self.reactNativeFactory = factory

    let window = UIWindow(frame: UIScreen.main.bounds)
    self.window = window

    factory.startReactNative(
      withModuleName: "AKIFY",
      in: window,
      launchOptions: launchOptions
    )
    window.makeKeyAndVisible()

    return true
  }

  // MARK: - Push Notification Methods
  func application(
     application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    print("APNs token retrieved: (deviceToken)")
    // Firebase Messaging에 APNs 토큰 설정
    Messaging.messaging().apnsToken = deviceToken
  }

  func application(
     application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("Unable to register for remote notifications: (error.localizedDescription)")
  }

  // MARK: - UNUserNotificationCenterDelegate
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // Firebase/Notifee에 위임하기 위해 completionHandler를 빈 옵션으로 호출
    // 이렇게 하면 Firebase의 Messaging 대리자가 자동으로 처리함
    completionHandler([])
  }


  func userNotificationCenter(
     center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    // Firebase/Notifee에 위임
    // React Native Firebase와 Notifee가 자동으로 processing
    completionHandler()
  }

  // MARK: - MessagingDelegate
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("Firebase registration token: (String(describing: fcmToken))")
    // FCM 토큰을 서버로 전송하거나 저장
    let dataDict: [String: String] = ["token": fcmToken ?? ""]
    NotificationCenter.default.post(
      name: Notification.Name("FCMToken"),
      object: nil,
      userInfo: dataDict
    )
  }

  // URL 스킴 처리 (Naver / Kakao / Facebook)
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    // Facebook SDK 처리
    let handled = ApplicationDelegate.shared.application(
      app,
      open: url,
      sourceApplication: options[UIApplication.OpenURLOptionsKey.sourceApplication] as? String,
      annotation: options[UIApplication.OpenURLOptionsKey.annotation]
    )
    if handled {
      return true
    }

    if url.scheme == "naverzUSFUbywPPEhYWwRlsKJ" {
      return NaverThirdPartyLoginConnection.getSharedInstance()
        .application(app, open: url, options: options)
    }
    if AuthApi.isKakaoTalkLoginUrl(url) {
      return AuthController.handleOpenUrl(url: url)
    }
    return false
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? { return self.bundleURL() }
  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
