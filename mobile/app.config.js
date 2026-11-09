// Konfigurasi dinamis Expo: isinya tetap dari app.json, ditambah satu pengaman.
// Build APK/AAB di EAS (EAS_BUILD=true) WAJIB punya EXPO_PUBLIC_API_URL berupa https://…/api.
// Tanpa ini, APK bisa terlanjur dibuat dengan alamat API lokal (http, IP VM) yang tidak bisa dijangkau HP.
module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  if (process.env.EAS_BUILD === 'true' && !/^https:\/\/[^/]+\/.*api\/?$/.test(apiUrl)) {
    throw new Error(
      `EXPO_PUBLIC_API_URL harus berupa URL https yang diakhiri /api (sekarang: "${apiUrl || 'kosong'}"). ` +
        'Isi dulu lewat: npx eas-cli env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://<api>/api'
    );
  }
  return config;
};
