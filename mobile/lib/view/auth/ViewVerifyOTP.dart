import 'package:bomcurriculo/include/BodyAuth.dart';
import 'package:bomcurriculo/theme/AppColors.dart';
import 'package:bomcurriculo/util/Translation.dart';
import 'package:bomcurriculo/widget/WidgetError.dart';
import 'package:flutter/material.dart';

import '../../controller/auth/ControllerVerifyOTP.dart';
import '../../widget/WidgetButton.dart';
import '../../widget/WidgetInputText.dart';

class ViewVerifyOTP extends StatefulWidget {
  const ViewVerifyOTP({super.key});
  @override
  _ViewVerifyOTP createState() => _ViewVerifyOTP();
}

class _ViewVerifyOTP extends State<ViewVerifyOTP> {
  late final ControllerVerifyOTP controller;

  @override
  void initState() {
    super.initState();
    controller = ControllerVerifyOTP(() {
      if (mounted) setState(() {});
    });
    controller.init();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BodyAuth(
      child: Column(
        children: [
          Text(
            Translation.instance.translate(
              'Type the OTP sent to your email to change your password',
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 30.0),
          Row(
            children: [
              Expanded(
                child: WidgetInputText(
                  controller: controller.controllerOTP1,
                  focusNode: controller.focusOTP1,
                  nextFocusNode: controller.focusOTP2,
                  maxLength: 1,
                  textAlignCenter: true,
                ),
              ),
              SizedBox(width: 5.0),
              Expanded(
                child: WidgetInputText(
                  controller: controller.controllerOTP2,
                  previousController: controller.controllerOTP1,
                  focusNode: controller.focusOTP2,
                  previousFocusNode: controller.focusOTP1,
                  nextFocusNode: controller.focusOTP3,
                  maxLength: 1,
                  textAlignCenter: true,
                ),
              ),
              SizedBox(width: 5.0),
              Expanded(
                child: WidgetInputText(
                  controller: controller.controllerOTP3,
                  previousController: controller.controllerOTP2,
                  focusNode: controller.focusOTP3,
                  previousFocusNode: controller.focusOTP2,
                  nextFocusNode: controller.focusOTP4,
                  maxLength: 1,
                  textAlignCenter: true,
                ),
              ),
              SizedBox(width: 5.0),
              Expanded(
                child: WidgetInputText(
                  controller: controller.controllerOTP4,
                  previousController: controller.controllerOTP3,
                  focusNode: controller.focusOTP4,
                  previousFocusNode: controller.focusOTP3,
                  nextFocusNode: controller.focusOTP5,
                  maxLength: 1,
                  textAlignCenter: true,
                ),
              ),
              SizedBox(width: 5.0),
              Expanded(
                child: WidgetInputText(
                  controller: controller.controllerOTP5,
                  previousController: controller.controllerOTP4,
                  focusNode: controller.focusOTP5,
                  previousFocusNode: controller.focusOTP4,
                  nextFocusNode: controller.focusOTP6,
                  maxLength: 1,
                  textAlignCenter: true,
                ),
              ),
              SizedBox(width: 5.0),
              Expanded(
                child: WidgetInputText(
                  controller: controller.controllerOTP6,
                  previousController: controller.controllerOTP5,
                  focusNode: controller.focusOTP6,
                  previousFocusNode: controller.focusOTP5,
                  maxLength: 1,
                  textAlignCenter: true,
                ),
              ),
            ],
          ),
          WidgetError(text: controller.errorText),
          GestureDetector(
            onTap: () => controller.doConfirmOTP(context),
            child: WidgetButton(
              title: Translation.instance.translate(
                controller.loading ? 'Loading' : 'Confirm OTP',
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
