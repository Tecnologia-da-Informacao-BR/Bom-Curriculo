import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../service/API.dart';
import '../../util/Translation.dart';
import '../../util/Validation.dart';

class ControllerForgotPassword {
  ControllerForgotPassword(this._notify);

  /// callback pra view chamar setState quando o estado interno mudar
  final VoidCallback _notify;

  bool loading = false;

  final FocusNode focusEmail = FocusNode();
  final controllerEmail = TextEditingController();

  String errorEmail = '';
  String errorText = '';

  Future<void> getTranslation() async {
    await Translation.instance.load("pt-BR");
    _notify();
  }

  void init() {
    getTranslation();
    focusEmail.requestFocus();
  }

  Future<void> doSendEmail(BuildContext context) async {
    bool error = false;

    // Reseta erros
    errorEmail = '';
    errorText = '';
    _notify();

    // Valida email
    if (controllerEmail.text == "") {
      errorEmail = Translation.instance.translate('Type your email');
      error = true;
    } else if (!Validation().isEmail(controllerEmail.text)) {
      errorEmail = Translation.instance.translate('Incorrect email');
      error = true;
    }

    // Se tiver erro
    if (error) {
      _notify();
      return;
    }

    // Se não tiver erro
    loading = true;
    errorEmail = '';
    errorText = '';
    _notify();

    API api = API();
    await api.post('auth/forgot-password', {'email': controllerEmail.text});

    if (!context.mounted) return;
    context.go("/auth/verify-otp");

    loading = false;
    _notify();
  }
}