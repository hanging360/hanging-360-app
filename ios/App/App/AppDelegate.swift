import UIKit
import Capacitor
import UserNotifications
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    private var enteredBackgroundAt: Date?
    private let foregroundRevalidateInterval: TimeInterval = 30

    private func revalidateRemotePortal() {
        guard
            let bridgeController = window?.rootViewController as? CAPBridgeViewController,
            let webView = bridgeController.bridge?.webView
        else { return }

        webView.configuration.websiteDataStore.httpCookieStore.getAllCookies { _ in
            DispatchQueue.main.async {
                webView.reloadFromOrigin()
            }
        }
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Revalidate the remote Capacitor portal on every cold start without
        // deleting WKWebsiteDataStore (cookies, localStorage, IndexedDB).
        URLCache.shared.removeAllCachedResponses()
        URLCache.shared.memoryCapacity = 0
        URLCache.shared.diskCapacity = 0

        // Foreground push presentation: banner + sonido + badge
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        let categoryIds = [
            "message", "whatsapp", "appointment_new",
            "appointment_update", "payment", "update"
        ]
        let categories = Set(categoryIds.map {
            UNNotificationCategory(identifier: $0, actions: [], intentIdentifiers: [], options: [])
        })
        center.setNotificationCategories(categories)

        DispatchQueue.main.async { [weak self] in self?.revalidateRemotePortal() }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
        enteredBackgroundAt = Date()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // El contador pertenece al estado de notificaciones de la PWA. No se
        // borra automáticamente al abrir la app; Badge.clear() lo hará cuando
        // el usuario haya leído realmente las alertas.
        if let backgroundDate = enteredBackgroundAt,
           Date().timeIntervalSince(backgroundDate) >= foregroundRevalidateInterval {
            enteredBackgroundAt = nil
            revalidateRemotePortal()
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    // MARK: - UNUserNotificationCenterDelegate
    // Mostrar banner + sonido + badge cuando la app está en foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .list, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        UIApplication.shared.applicationIconBadgeNumber = 0
        completionHandler()
    }

}
