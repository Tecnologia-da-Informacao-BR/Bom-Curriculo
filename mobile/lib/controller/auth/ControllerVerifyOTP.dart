import 'package:flutter/material.dart';

import '../../service/API.dart';
import '../../util/Translation.dart';
import '../../view/auth/ViewResetPassword.dart';

class ControllerVerifyOTP {
  ControllerVerifyOTP(this._notify);

  /// callback pra view chamar setState quando o estado interno mudar
  final VoidCallback _notify;

  bool loading = false;

  String errorText = '';

  final controllerOTP1 = TextEditingController();
  final controllerOTP2 = TextEditingController();
  final controllerOTP3 = TextEditingController();
  final controllerOTP4 = TextEditingController();
  final controllerOTP5 = TextEditingController();
  final controllerOTP6 = TextEditingController();

  final focusOTP1 = FocusNode();
  final focusOTP2 = FocusNode();
  final focusOTP3 = FocusNode();
  final focusOTP4 = FocusNode();
  final focusOTP5 = FocusNode();
  final focusOTP6 = FocusNode();

  Future<void> getTranslation() async {
    await Translation.instance.load("pt-BR");
    _notify();
  }

  void init() {
    getTranslation();
    focusOTP1.requestFocus();
  }

  void dispose() {
    controllerOTP1.dispose();
    controllerOTP2.dispose();
    controllerOTP3.dispose();
    controllerOTP4.dispose();
    controllerOTP5.dispose();
    controllerOTP6.dispose();

    focusOTP1.dispose();
    focusOTP2.dispose();
    focusOTP3.dispose();
    focusOTP4.dispose();
    focusOTP5.dispose();
    focusOTP6.dispose();
  }

  Future<void> doConfirmOTP(BuildContext context) async {
    loading = true;
    errorText = '';
    _notify();

    if (controllerOTP1.text == "" ||
        controllerOTP2.text == "" ||
        controllerOTP3.text == "" ||
        controllerOTP4.text == "" ||
        controllerOTP5.text == "" ||
        controllerOTP6.text == "") {
      //erro
      errorText = Translation.instance.translate('Invalid OTP');
      loading = false;
      _notify();
      return;
    }

    String otp = "";
    otp += controllerOTP1.text;
    otp += controllerOTP2.text;
    otp += controllerOTP3.text;
    otp += controllerOTP4.text;
    otp += controllerOTP5.text;
    otp += controllerOTP6.text;

    API api = API();
    var response = await api.post('auth/verify-otp', {'otp': otp});

    if (!context.mounted) return;
    if (response.statusCode == 200) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => ViewResetPassword(otp: otp)),
      );
    } else if (response.statusCode == 422) {
      errorText = Translation.instance.translate('Invalid OTP');
    } else {
      errorText = Translation.instance.translate('Server comunication error');
    }

    loading = false;
    _notify();
  }
}
