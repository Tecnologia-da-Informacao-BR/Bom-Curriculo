import 'package:bomcurriculo/include/BodyAuth.dart';
import 'package:bomcurriculo/theme/AppColors.dart';
import 'package:bomcurriculo/util/Translation.dart';
import 'package:bomcurriculo/widget/WidgetError.dart';
import 'package:flutter/material.dart';

import '../../controller/auth/ControllerForgotPassword.dart';
import '../../widget/WidgetButton.dart';
import '../../widget/WidgetInputText.dart';

class ViewForgotPassword extends StatefulWidget {
  const ViewForgotPassword({super.key});
  @override
  _ViewForgotPassword createState() => _ViewForgotPassword();
}

class _ViewForgotPassword extends State<ViewForgotPassword> {
  late final ControllerForgotPassword controller;

  @override
  void initState() {
    super.initState();
    controller = ControllerForgotPassword(() {
      if (mounted) setState(() {});
    });
    controller.init();
  }

  @override
  Widget build(BuildContext context) {
    return BodyAuth(
      child: Column(
        children: [
          Text(
            Translation.instance.translate(
              'Forgot your password? Type your email to receive OTP code to change your password',
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 30.0),
          WidgetInputText(
            title: 'Email',
            controller: controller.controllerEmail,
            error: controller.errorEmail,
            focusNode: controller.focusEmail,
          ),
          WidgetError(text: controller.errorText),
          GestureDetector(
            onTap: () => controller.doSendEmail(context),
            child: WidgetButton(
              title: Translation.instance.translate(controller.loading?'Loading':'Recover password'),
              color: controller.loading ? Colors.black26 : AppColorsLight.brandPrimary,
            ),
          ),
        ],
      ),
    );
  }
}