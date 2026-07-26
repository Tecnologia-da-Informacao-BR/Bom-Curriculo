import 'dart:convert';

import 'package:bomcurriculo/service/API.dart';
import 'package:flutter/material.dart';

import '../service/DB.dart';
import '../util/Translation.dart';

class ControllerHome {
  ControllerHome(this._notify);

  /// callback pra view chamar setState quando o estado interno mudar
  final VoidCallback _notify;

  bool loading = false;

  String name = '';
  String email = '';
  String emailVerifiedAt = '';
  String createdAt = '';
  String updatedAt = '';
  String githubLink = '';
  String siteLink = '';
  String socialName = '';
  String phone = '';
  String resume = '';
  String resumeEmail = '';
  String gender = '';
  bool isPcd = false;
  String city = '';
  String state = '';
  String country = '';
  String linkedinLink = '';

  var items = [];

  Future<void> getTranslation() async {
    await Translation.instance.load("pt-BR");
    _notify();
  }

  void init() {
    getTranslation();
    doAction();
  }

  Future<void> doAction() async {
    
    loading = true;
    _notify();

    try {

      var response = await API().get('client/user/resumes');
      var body = jsonDecode(response.body);

      var userWebData = body['data']['data'];

      for (var data in userWebData) {
        String status = data['status'];
        String title = '---';
        String subtitle = 'Em  prsamento';
        String score = '---';
        if (status == 'pending') {
          subtitle = 'Em processamento';
        } else if (status == 'fail') {
          subtitle = 'Falha ao processar currículo';
        }
        items.add({
          'uuid': data['id'],
          'type': status,
          'title': title,
          'subtitle': subtitle,
          'score': score,
          'downloadURL': data['original_file_path_cv'],
        });
      }

      final user = await DB.instance.getUser();

      final userData = jsonDecode(user!);

      name = userData['name'] ?? '';
      email = userData['email'] ?? '';
      emailVerifiedAt = userData['email_verified_at'] ?? '';
      createdAt = userData['created_at'] ?? '';
      updatedAt = userData['updated_at'] ?? '';
      githubLink = userData['github_link'] ?? '';
      siteLink = userData['site_link'] ?? '';
      socialName = userData['social_name'] ?? '';
      phone = userData['phone'] ?? '';
      resume = userData['resume'] ?? '';
      resumeEmail = userData['resume_email'] ?? '';
      gender = userData['gender'] ?? '';
      isPcd = (userData['is_pcd'] ?? 0) == 1;
      city = userData['city'] ?? '';
      state = userData['state'] ?? '';
      country = userData['country'] ?? '';
      linkedinLink = userData['linkedin_link'] ?? '';
    } catch (e) {
      debugPrint('Erro ao carregar dados do usuario: $e');
    }

    loading = false;
    _notify();
  }
}