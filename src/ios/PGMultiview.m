
#include <sys/types.h>
#include <sys/sysctl.h>
#include "TargetConditionals.h"

#import <QuartzCore/CoreAnimation.h>
#import <Cordova/CDV.h>
#import "PGMultiView.h"


#pragma mark PGMultiViewController - CDVViewController subclass

@implementation PGMultiViewController
@synthesize pgmDelegate;
@synthesize messageFromParent;


- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event {
    if (UIEventSubtypeMotionShake) {
        [self.navigationController popViewControllerAnimated:YES];
    }
}

- (BOOL)prefersStatusBarHidden {
    return YES;
}

/*
 重写CDVViewController方法，这样就可以根据自己的需要加载插件了
 这里是不加载 CDVSplashScreen 这个插件
 */
- (void)registerPlugin:(CDVPlugin*)plugin withClassName:(NSString*)className
{
    if([className isEqualToString:@"CDVSplashScreen"]){
        return;
    }
    [super registerPlugin:plugin withClassName:className];
}

/*
 重写这个插件不管用，不能达到阻止加载相应插件的功能
 */
-(void)registerPlugin:(CDVPlugin *)plugin withPluginName:(NSString *)pluginName
{
    NSString* className = NSStringFromClass([plugin class]);
    if([className isEqualToString:@"splashscreen"]){
        return;
    }
    [super registerPlugin:plugin withPluginName:pluginName];
}

@end


#pragma mark PGMultiView - CDVPlugin subclass

@implementation PGMultiView

@synthesize childViewController;


- (BOOL) shouldOverrideLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType
{
    return YES;
}

// TODO: maybe override this, and use the config.xml for the currently loaded page
// also, add ALL orientations to the application
// - (BOOL)supportsOrientation:(UIInterfaceOrientation)orientation
// {
//     return [self.supportedOrientations containsObject:[NSNumber numberWithInt:orientation]];
// }

#pragma mark UINavigationControllerDelegate

- (void)navigationController:(UINavigationController *)navigationController
      willShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
    if(viewController == self.viewController)
    {
        navigationController.navigationBarHidden = YES;
    }
    else
    {
        navigationController.navigationBarHidden = YES; //NO;
    }
}


#pragma mark JS Callable Plugin API

- (void)dismissView:(CDVInvokedUrlCommand*)command
{
    NSString* msg = [command argumentAtIndex:0];
    PGMultiViewController* topView = (PGMultiViewController*)[self.viewController.navigationController popViewControllerAnimated:YES];
    // seend the message back to our creator
    [topView.pgmDelegate dismissWithResult:msg];

    self.viewController.navigationController.navigationBarHidden = YES;
    childViewController = NULL;

    // When we get this message, we are dismissing the view so there is no need to use a callback into js
}

- (void)loadView:(CDVInvokedUrlCommand*)command
{
    childViewController = [[PGMultiViewController alloc] init];
    childViewController.pgmDelegate = self;
    childViewController.startPage = [command argumentAtIndex:0];
    childViewController.messageFromParent = [command argumentAtIndex:1];

    self.callbackId = command.callbackId;

    // TODO: set proper config.xml -> childViewController.configFile

    if(self.viewController.navigationController == NULL)
    {
        UINavigationController* nav = [[UINavigationController alloc] init];
        nav.navigationBarHidden = YES;
        nav.delegate = self;
        self.webView.window.rootViewController = nav;
        [nav pushViewController:self.viewController animated:NO];
//        nav.hidesBarsOnSwipe  = YES;
//        nav.hidesBarsOnTap = YES;
    }

    [self.viewController.navigationController pushViewController:childViewController animated:YES];
}

- (void)getMessage:(CDVInvokedUrlCommand*)command
{
    PGMultiViewController* currentViewController = (PGMultiViewController*)self.viewController;
    if([currentViewController isKindOfClass:[PGMultiViewController class]]) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                          messageAsString:currentViewController.messageFromParent];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    else {
        CDVPluginResult* pluginError = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"NoValue"];
         [self.commandDelegate sendPluginResult:pluginError callbackId:command.callbackId];
    }
}


#pragma mark PGMultiViewDelegate

- (void)dismissWithResult:(NSString*)result
{
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:result];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
}

@end
