import 'package:bomcurriculo/include/BodyAuth.dart';
import 'package:bomcurriculo/widget/WidgetError.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';


import '../../controller/auth/ControllerLogin.dart';
import '../../util/Translation.dart';
import '../../widget/WidgetButton.dart';
import '../../widget/WidgetInputText.dart';

class ViewLogin extends StatefulWidget {
  const ViewLogin({super.key});
  @override
  _ViewLogin createState() => _ViewLogin();
}

class _ViewLogin extends State<ViewLogin> {
  late final ControllerLogin controller;

  @override
  void initState() {
    super.initState();
    controller = ControllerLogin(() {
      if (mounted) setState(() {});
    });
    controller.init();
  }

  @override
  Widget build(BuildContext context) {
    return BodyAuth(
      child: Column(
        children: [
          WidgetInputText(
            title: 'Email',
            error: controller.errorEmail,
            controller: controller.controllerEmail,
            maxLength: 128,
          ),
          WidgetInputText(
            title: Translation.instance.translate('Password'),
            error: controller.errorPassword,
            controller: controller.controllerPassword,
            isPassword: true,
            maxLength: 64,
          ),

          WidgetError(text: controller.errorText),

          GestureDetector(
            onTap: () => controller.doLogin(context),
            child: WidgetButton(
              title: controller.loading
                  ? '${Translation.instance.translate('Loading')}...'
                  : Translation.instance.translate('Login'),
              color: controller.loading ? Colors.black26 : Colors.blue,
            ),
          ),

          SizedBox(height: 30.0),
          GestureDetector(
            onTap: () {
              context.go("/auth/register");
            },
            child: Text(Translation.instance.translate('Signup for free')),
          ),
          SizedBox(height: 15.0),
          GestureDetector(
            onTap: () {
              context.go("/auth/forgot-passwor");
            },
            child: Text(Translation.instance.translate('Forgot password')),
          ),
          SizedBox(height: 15.0),
        ],
      ),
    );
  }
}