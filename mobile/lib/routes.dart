import 'package:bomcurriculo/view/view_home.dart';
import 'package:bomcurriculo/view/auth/view_forgot_password.dart';
import 'package:bomcurriculo/view/auth/view_login.dart';
import 'package:bomcurriculo/view/auth/view_register.dart';
import 'package:bomcurriculo/view/auth/view_reset_password.dart';
import 'package:bomcurriculo/view/auth/view_verify_otp.dart';
import 'package:bomcurriculo/view/resume/view_new_resume.dart';
import 'package:bomcurriculo/view/resume/view_generate_resume.dart';
import 'package:go_router/go_router.dart';

GoRouter createRouter(bool logged) {
  return GoRouter(
    initialLocation: logged ? "/" : "/auth/login",
    routes: [
      GoRoute(path: "/", builder: (context, state) => const ViewHome()),
      GoRoute(
        path: "/auth/login",
        builder: (context, state) => const ViewLogin(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => ViewRegister(),
      ),
      GoRoute(
        path: '/auth/forgot-password',
        builder: (context, state) => ViewForgotPassword(),
      ),
      GoRoute(
        path: '/auth/verify-otp',
        builder: (context, state) => ViewVerifyOTP(),
      ),
      GoRoute(
        path: '/auth/reset-password',
        builder: (context, state) => ViewResetPassword(otp: "123456"),
      ),
      GoRoute(
        path: '/resume/new-resume',
        builder: (context, state) => ViewNewResume(),
      ),
      GoRoute(
        path: '/resume/generate-resume',
        builder: (context, state) => ViewGenerateResume(),
      ),
    ],
  );
}
