import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../service/API.dart';
import '../../service/DB.dart';
import '../../util/Translation.dart';
import '../../util/Validation.dart';

class ControllerRegister {
  ControllerRegister(this._notify);

  /// callback pra view chamar setState quando o estado interno mudar
  final VoidCallback _notify;

  bool loading = false;

  final controllerName = TextEditingController();
  final controllerEmail = TextEditingController();
  final controllerPassword = TextEditingController();
  final controllerRetypePassword = TextEditingController();

  String errorName = '';
  String errorEmail = '';
  String errorPassword = '';
  String errorRetypePassword = '';
  String errorText = '';

  Future<void> getTranslation() async {
    await Translation.instance.load("pt-BR");
    _notify();
  }

  void init() {
    getTranslation();
  }

  Future<void> doRegister(BuildContext context) async {
    bool error = false;

    // Reseta erros
    errorName = '';
    errorEmail = '';
    errorPassword = '';
    errorRetypePassword = '';
    errorText = '';
    _notify();

    // Valida nome
    if (controllerName.text == "") {
      errorName = Translation.instance.translate('Type your name');
      error = true;
    }

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
    } else if (controllerRetypePassword.text == "") {
      errorRetypePassword = Translation.instance.translate(
        'Retype your password',
      );
      error = true;
    } else if (controllerPassword.text != controllerRetypePassword.text) {
      errorRetypePassword = Translation.instance.translate(
        'Your password doesn\'t match',
      );
      error = true;
    }

    // Se tiver erro
    if (error) {
      _notify();
      return;
    }

    // Se não tiver erro
    loading = true;
    errorName = '';
    errorEmail = '';
    errorPassword = '';
    errorRetypePassword = '';
    errorText = '';
    _notify();

    final fcm = await DB.instance.getFCM();

    API api = API();
    var payload = {
      'name': controllerName.text,
      'email': controllerEmail.text,
      'password': controllerPassword.text,
      'password_confirm': controllerRetypePassword.text,
      'fcm': fcm,
    };
    debugPrint("**********************************");
    debugPrint(payload.toString());
    debugPrint("**********************************");
    var response = await api.post('auth/register', payload);

    var body = jsonDecode(response.body);

    if (response.statusCode == 201) {
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
      errorName = '';
      errorEmail = '';
      errorPassword = '';
      errorText = errorString;
      //errorText=body['message'];
      _notify();
    } else {
      loading = false;
      errorName = '';
      errorEmail = '';
      errorPassword = '';
      errorText = '';
      //errorText=body['message'];
      _notify();
    }
  }
}