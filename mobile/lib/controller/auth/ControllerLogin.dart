import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../service/API.dart';
import '../../service/DB.dart';
import '../../util/Translation.dart';
import '../../util/Validation.dart';

class ControllerLogin {
  ControllerLogin(this._notify);

  /// callback pra view chamar setState quando o estado interno mudar
  final VoidCallback _notify;

  bool loading = false;

  final controllerEmail = TextEditingController();
  final controllerPassword = TextEditingController();

  String errorEmail = '';
  String errorPassword = '';
  String errorText = '';

  Future<void> getTranslation() async {
    await Translation.instance.load("pt-BR");
    _notify();
  }

  void init() {
    getTranslation();
  }

  Future<void> doLogin(BuildContext context) async {
    bool error = false;

    // Reseta erros
    errorEmail = '';
    errorPassword = '';
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

    // Valida senha
    if (controllerPassword.text == "") {
      errorPassword = Translation.instance.translate('Type your password');
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
    errorPassword = '';
    errorText = '';
    _notify();

    final fcm = await DB.instance.getFCM();

    API api = API();
    var payload = {
      'email': controllerEmail.text,
      'password': controllerPassword.text,
      'fcm': fcm,
    };
    var response = await api.post('auth/login', payload);

    var body = jsonDecode(response.body);

    if (response.statusCode == 200) {
      if (body['data']['token'] != "") {
        await DB.instance.saveJWT(body['data']['token']);
      }
      String user = jsonEncode(body['data']['user']);
      await DB.instance.saveUser(user);

      if (!context.mounted) return;
      context.go("/");
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

      loading = false;
      errorEmail = '';
      errorPassword = '';
      errorText = errorString;
      _notify();
    } else {
      loading = false;
      errorEmail = '';
      errorPassword = '';
      errorText = '';
      _notify();
    }
  }
}
