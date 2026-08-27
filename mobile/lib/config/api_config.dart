import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:bomcurriculo/config/environment.dart';

class ApiConfig {
  static String get baseUrl {
    // 1. PRIORIDADE MÁXIMA: --dart-define=API_URL=...
    // Verifica se foi passado via ambiente Dart
    final dartDefineUrl = String.fromEnvironment('API_URL', defaultValue: '');
    if (dartDefineUrl.isNotEmpty) {
      return dartDefineUrl;
    }

    // 2. Produção
    if (Environment.isProduction) {
      final prodUrl = dotenv.env['API_URL_PROD'];
      if (prodUrl != null && prodUrl.isNotEmpty) {
        return prodUrl;
      }
      return 'https://api.bomcurriculo.com'; // fallback produção
    }

    // 4. Desenvolvimento - verificar dispositivo físico vs emulador
    if (Environment.isPhysicalDevice) {
      // Dispositivo físico: usar IP configurado via .env
      final physicalUrl = dotenv.env['API_URL_DEV_PHYSICAL'];
      if (physicalUrl != null && physicalUrl.isNotEmpty) {
        return physicalUrl;
      }
      // Fallback se .env não tiver o IP
      return 'http://192.168.31.137:9000';
    }

    // 5. Emulador Android
    if (kIsWeb || !Environment.isPhysicalDevice && defaultTargetPlatform == TargetPlatform.android) {
      final androidUrl = dotenv.env['API_URL_ANDROID_EMULATOR'];
      if (androidUrl != null && androidUrl.isNotEmpty) {
        return androidUrl;
      }
      return 'http://10.0.2.2:3000';
    }

    // 6. Emulador iOS
    if (defaultTargetPlatform == TargetPlatform.iOS && !Environment.isPhysicalDevice) {
      final iosUrl = dotenv.env['API_URL_IOS_EMULATOR'];
      if (iosUrl != null && iosUrl.isNotEmpty) {
        return iosUrl;
      }
      return 'http://localhost:3000';
    }

    // 6. Fallback final
    return 'http://localhost:3000';
  }

  static String get debugInfo {
    final envStatus = dotenv.env.isNotEmpty ? '✅ Carregado' : '❌ Não carregado';

    return '''🌍 AMBIENTE: ${Environment.environment.name}
📱 FÍSICO: ${Environment.isPhysicalDevice ? 'true' : 'false'}
🔗 URL: $baseUrl
📄 .env: $envStatus''';
  }
}