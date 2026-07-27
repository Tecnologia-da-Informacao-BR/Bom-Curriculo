import 'package:bomcurriculo/include/BodyAuth.dart';
import 'package:bomcurriculo/theme/AppColors.dart';
import 'package:bomcurriculo/util/Translation.dart';
import 'package:bomcurriculo/widget/WidgetError.dart';
import 'package:flutter/material.dart';

import '../../controller/auth/ControllerResetPassword.dart';
import '../../widget/WidgetButton.dart';
import '../../widget/WidgetInputText.dart';

class ViewResetPassword extends StatefulWidget {
  const ViewResetPassword({super.key, required this.otp});

  final String otp;

  @override
  _ViewResetPassword createState() => _ViewResetPassword();
}

class _ViewResetPassword extends State<ViewResetPassword> {
  late final ControllerResetPassword controller;

  @override
  void initState() {
    super.initState();
    controller = ControllerResetPassword(() {
      if (mounted) setState(() {});
    }, widget.otp);
    controller.init();
  }

  @override
  Widget build(BuildContext context) {
    return BodyAuth(
      child: Column(
        children: [
          Text(
            Translation.instance.translate(
              'Type and confirm your password to change',
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 30.0),
          WidgetInputText(
            title: Translation.instance.translate('New password'),
            controller: controller.controllerPassword,
            error: controller.errorPassword,
            focusNode: controller.focusPassword,
            isPassword: true,
          ),
          WidgetInputText(
            title: Translation.instance.translate('Retype your password'),
            controller: controller.controllerPasswordConfirm,
            error: controller.errorPasswordConfirm,
            focusNode: controller.focusPasswordConfirm,
            isPassword: true,
          ),
          WidgetError(text: controller.errorText),
          GestureDetector(
            onTap: () => controller.doPasswordChange(context),
            child: WidgetButton(
              title: Translation.instance.translate(
                controller.loading ? 'Loading' : 'Update password',
              ),
              color: controller.loading
                  ? Colors.black26
                  : AppColorsLight.brandPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
