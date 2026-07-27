import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../service/API.dart';
import '../../util/Translation.dart';

class ControllerResetPassword {
  ControllerResetPassword(this._notify, this.otp);

  /// callback pra view chamar setState quando o estado interno mudar
  final VoidCallback _notify;
  final String otp;

  bool loading = false;

  final focusPassword = FocusNode();
  final focusPasswordConfirm = FocusNode();
  final controllerPassword = TextEditingController();
  final controllerPasswordConfirm = TextEditingController();

  String errorText = '';
  String errorPassword = '';
  String errorPasswordConfirm = '';

  Future<void> getTranslation() async {
    await Translation.instance.load("pt-BR");
    _notify();
  }

  void init() {
    getTranslation();
    focusPassword.requestFocus();
  }

  Future<void> doPasswordChange(BuildContext context) async {
    bool error = false;

    // Reseta erros
    errorPassword = '';
    errorPasswordConfirm = '';
    _notify();

    // Valida email
    if (controllerPassword.text == "") {
      errorPassword = Translation.instance.translate('Type your new password');
      focusPassword.requestFocus();
      error = true;
    } else if (controllerPasswordConfirm.text == "") {
      errorPasswordConfirm = Translation.instance.translate(
        'Type your new password again',
      );
      focusPasswordConfirm.requestFocus();
      error = true;
    } else if (controllerPassword.text != controllerPasswordConfirm.text) {
      errorPasswordConfirm = Translation.instance.translate(
        'Your passwords doesn\'t match',
      );
      focusPasswordConfirm.requestFocus();
      error = true;
    }

    // Se tiver erro
    if (error) {
      _notify();
      return;
    }

    // Se não tiver erro
    loading = true;
    errorPassword = '';
    errorPasswordConfirm = '';
    _notify();

    API api = API();
    var response = await api.post('auth/reset-password', {
      'password': controllerPassword.text,
      'password_confirm': controllerPasswordConfirm.text,
      'otp': otp,
    });

    var body = jsonDecode(response.body);

    if (!context.mounted) return;
    if (response.statusCode == 200) {
      context.go("/auth/login");
    } else if (response.statusCode == 422) {
      final Map<String, dynamic> errors = body['data']['errors'];

      final List<String> messages = [];
      errors.forEach((key, value) {
        if (value is List) {
          messages.addAll(value.map((e) => e.toString()));
        } else if (value != null) {
          messages.add(value.toString());
        }
      });

      final errorString = messages.join('\n');
      errorText = errorString;
    } else {
      errorText = 'Erro na comunicação com o servidor';
    }

    loading = false;
    _notify();
  }
}
