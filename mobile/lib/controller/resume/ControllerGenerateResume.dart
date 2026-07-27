import 'package:flutter/material.dart';

import '../../util/Translation.dart';

class ControllerGenerateResume {
  ControllerGenerateResume(this._notify);

  /// callback pra view chamar setState quando o estado interno mudar
  final VoidCallback _notify;

  // Dados pessoais
  List<Map<String, dynamic>> personalData = [
    {'title': 'Nome', 'value': 'Alexandre Martins', 'checked': true},
    {'title': 'Email', 'value': 'alexandre@email.com', 'checked': true},
    {'title': 'Phone', 'value': '(11) 99999-9999', 'checked': true},
    {'title': 'City', 'value': 'São Paulo - SP', 'checked': true},
    {
      'title': 'LinkedIn',
      'value': 'linkedin.com/in/alexandre',
      'checked': true,
    },
    {'title': 'GitHub', 'value': 'github.com/alexandre', 'checked': true},
  ];

  // Resumo
  List<Map<String, dynamic>> summary = [
    {
      'description':
          'Engenheiro de Software Sênior com mais de 8 anos de experiência em desenvolvimento Full Stack, arquitetura escalável, liderança técnica e otimização de performance.',
      'checked': true,
    },
  ];

  // Experiências
  List<Map<String, dynamic>> experiences = [
    {
      'title': 'Tech Lead & Full Stack Developer',
      'company': 'GlobalTech Solutions',
      'date_start': 'Jan/2020',
      'date_end': 'Atual',
      'checked': true,
    },
    {
      'title': 'Senior Software Engineer',
      'company': 'Innovation Hub',
      'date_start': 'Mar/2017',
      'date_end': 'Dez/2019',
      'checked': true,
    },
    {
      'title': 'Software Developer',
      'company': 'Soft Company',
      'date_start': 'Jan/2015',
      'date_end': 'Fev/2017',
      'checked': true,
    },
  ];

  // Formação
  List<Map<String, dynamic>> education = [
    {
      'title': 'Bacharelado em Ciência da Computação',
      'institution': 'Universidade Federal de São Paulo',
      'checked': true,
    },
    {
      'title': 'Pós-graduação em Engenharia de Software',
      'institution': 'USP',
      'checked': true,
    },
  ];

  // Cursos
  List<Map<String, dynamic>> courses = [
    {'title': 'Flutterando Masterclass', 'checked': true},
    {'title': 'Clean Architecture', 'checked': true},
    {'title': 'Git e GitHub', 'checked': true},
    {'title': 'Docker Essentials', 'checked': true},
  ];

  // Skills
  List<Map<String, dynamic>> skills = [
    {'title': 'Flutter', 'years': 4, 'checked': true},
    {'title': 'Dart', 'years': 4, 'checked': true},
    {'title': 'Firebase', 'years': 3, 'checked': true},
    {'title': 'REST API', 'years': 4, 'checked': true},
    {'title': 'Git', 'years': 6, 'checked': true},
  ];

  // Idiomas
  List<Map<String, dynamic>> languages = [
    {'title': 'Portuguese', 'level': 'Nativo', 'checked': true},
    {'title': 'English', 'level': 'Avançado', 'checked': true},
    {'title': 'Spanish', 'level': 'Intermediário', 'checked': true},
  ];

  Future<void> getTranslation() async {
    await Translation.instance.load("pt-BR");
    _notify();
  }

  void init() {
    getTranslation();
  }

  /// alterna o campo 'checked' de qualquer item das listas acima
  void toggleChecked(Map<String, dynamic> item) {
    item['checked'] = !item['checked'];
    _notify();
  }

  Future<void> generateResume() async {}
}
