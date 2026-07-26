import 'package:bomcurriculo/include/BodyAuth.dart';
import 'package:bomcurriculo/theme/AppColors.dart';
import 'package:bomcurriculo/util/Translation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../controller/auth/ControllerRegister.dart';
import '../../widget/WidgetButton.dart';
import '../../widget/WidgetError.dart';
import '../../widget/WidgetInputText.dart';

class ViewRegister extends StatefulWidget {
  const ViewRegister({super.key});
  @override
  _ViewRegister createState() => _ViewRegister();
}

class _ViewRegister extends State<ViewRegister> {
  late final ControllerRegister controller;

  @override
  void initState() {
    super.initState();
    controller = ControllerRegister(() {
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
            title: Translation.instance.translate('Name'),
            controller: controller.controllerName,
            error: controller.errorName,
            maxLength: 128,
          ),
          WidgetInputText(
            title: 'Email',
            controller: controller.controllerEmail,
            error: controller.errorEmail,
            maxLength: 64,
          ),
          WidgetInputText(
            title: Translation.instance.translate('Type your password'),
            controller: controller.controllerPassword,
            error: controller.errorPassword,
            isPassword: true,
            maxLength: 64,
          ),
          WidgetInputText(
            title: Translation.instance.translate('Retype your password'),
            controller: controller.controllerRetypePassword,
            error: controller.errorRetypePassword,
            isPassword: true,
            maxLength: 64,
          ),
          WidgetError(text: controller.errorText),
          GestureDetector(
            onTap: () => controller.doRegister(context),
            child: WidgetButton(
              title: Translation.instance.translate(controller.loading?'Loading':'Register'),
              color: controller.loading ? Colors.black26 : AppColorsLight.brandPrimary,
            ),
          ),
          SizedBox(height: 30.0),
          GestureDetector(
            onTap: () {
              context.go("/auth/login");
            },
            child: Text(Translation.instance.translate('Back to login')),
          ),
          SizedBox(height: 15.0),
        ],
      ),
    );
  }
}