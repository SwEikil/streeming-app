import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:video_player/video_player.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

const String apiBase = 'http://10.0.2.2:4000';
const String wsBase = 'ws://10.0.2.2:4000';
const String sampleHls = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const Color kBg = Color(0xFF0E0E10);
const Color kSurface = Color(0xFF18181B);
const Color kSurface2 = Color(0xFF1F1F23);
const Color kBorder = Color(0xFF2F2F35);
const Color kBrand = Color(0xFF9147FF);
const Color kDanger = Color(0xFFEB0400);
const Color kText = Color(0xFFEFEFF1);
const Color kMuted = Color(0xFF7B7B8B);

void main() => runApp(const StreemingApp());

class StreemingApp extends StatelessWidget {
  const StreemingApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Streeming',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: kBg,
        colorSchemeSeed: kBrand,
        useMaterial3: true,
        appBarTheme: const AppBarTheme(backgroundColor: kSurface, surfaceTintColor: Colors.transparent),
        cardTheme: const CardThemeData(color: kSurface),
        chipTheme: const ChipThemeData(backgroundColor: kSurface2),
      ),
      home: const MainShell(),
    );
  }
}

// ========== MODELS ==========

class UserInfo {
  final String id, email, role;
  UserInfo({required this.id, required this.email, required this.role});
  factory UserInfo.fromJson(Map<String, dynamic> j) => UserInfo(id: j['id'], email: j['email'], role: j['role']);
}

class StreamItem {
  final String id, title, status, userId;
  final String description, category;
  final List<String> tags;
  final String? ingestUrl, streamKey, thumbnailUrl;
  final Map<String, dynamic> settings;
  StreamItem({required this.id, required this.title, required this.status, required this.userId,
    this.description = '', this.category = 'other', this.tags = const [],
    this.ingestUrl, this.streamKey, this.thumbnailUrl, this.settings = const {}});
  factory StreamItem.fromJson(Map<String, dynamic> j) => StreamItem(
    id: j['id'], title: j['title'], status: j['status'] ?? 'offline', userId: j['user_id'],
    description: j['description'] ?? '', category: j['category'] ?? 'other',
    tags: (j['tags'] as List?)?.cast<String>() ?? [],
    ingestUrl: j['ingest_url'], streamKey: j['stream_key'], thumbnailUrl: j['thumbnail_url'],
    settings: j['settings'] is Map ? j['settings'] : {},
  );
  bool get isLive => status == 'live';
  String get maxQuality => (settings['max_quality'] ?? '1080p') as String;
  int get delay => (settings['delay_seconds'] ?? 0) as int;
  bool get mature => (settings['mature_content'] ?? false) as bool;
}

// ========== API ==========

class Api {
  String? token, refresh;
  Map<String, String> get _h => {'Content-Type': 'application/json', if (token != null) 'Authorization': 'Bearer $token'};

  Future<Map<String, dynamic>> _post(String p, Map<String, dynamic> b) async {
    final r = await http.post(Uri.parse('$apiBase$p'), headers: _h, body: jsonEncode(b));
    if (r.statusCode >= 400) throw Exception(jsonDecode(r.body)['error'] ?? 'Error');
    return jsonDecode(r.body);
  }
  Future<Map<String, dynamic>> _get(String p) async {
    final r = await http.get(Uri.parse('$apiBase$p'), headers: _h);
    if (r.statusCode >= 400) throw Exception('Error');
    return jsonDecode(r.body);
  }

  Future<UserInfo> register(String e, String p) async { final d = await _post('/auth/register', {'email': e, 'password': p}); token = d['accessToken']; refresh = d['refreshToken']; return UserInfo.fromJson(d['user']); }
  Future<UserInfo> login(String e, String p) async { final d = await _post('/auth/login', {'email': e, 'password': p}); token = d['accessToken']; refresh = d['refreshToken']; return UserInfo.fromJson(d['user']); }
  Future<List<StreamItem>> getStreams() async { final d = await _get('/streams'); return (d['streams'] as List).map((s) => StreamItem.fromJson(s)).toList(); }
  Future<StreamItem> createStream(Map<String, dynamic> body) async { final d = await _post('/streams', body); return StreamItem.fromJson(d['stream']); }
  Future<void> startStream(String id) async { await _post('/streams/$id/start', {}); }
  Future<void> stopStream(String id) async { await _post('/streams/$id/stop', {}); }
  Future<void> deleteStream(String id) async { await http.delete(Uri.parse('$apiBase/streams/$id'), headers: _h); }
  void logout() { _post('/auth/logout', {'refreshToken': refresh ?? ''}).catchError((_) {}); token = null; refresh = null; }
}

final api = Api();

// ========== MAIN SHELL (bottom nav) ==========

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _tab = 0;
  UserInfo? _user;
  List<StreamItem> _streams = [];

  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async { try { _streams = await api.getStreams(); setState(() {}); } catch (_) {} }

  void _onAuth(UserInfo u) { setState(() => _user = u); _load(); }
  void _logout() { api.logout(); setState(() { _user = null; _tab = 0; }); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _tab, children: [
        HomePage(streams: _streams, user: _user, onRefresh: _load, onAuth: () => _pushAuth(context), onWatch: (s) => _pushWatch(context, s)),
        BrowsePage(streams: _streams, onWatch: (s) => _pushWatch(context, s)),
        _user != null ? DashboardPage(streams: _streams, userId: _user!.id, onRefresh: _load) : _authPrompt(context),
        ProfilePage(user: _user, onAuth: () => _pushAuth(context), onLogout: _logout),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        backgroundColor: kSurface,
        indicatorColor: kBrand.withOpacity(0.2),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore), label: 'Browse'),
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _authPrompt(BuildContext ctx) => Center(child: FilledButton(onPressed: () => _pushAuth(ctx), child: const Text('Увійти')));
  void _pushAuth(BuildContext ctx) => Navigator.push(ctx, MaterialPageRoute(builder: (_) => AuthPage(onSuccess: (u) { _onAuth(u); Navigator.pop(ctx); })));
  void _pushWatch(BuildContext ctx, StreamItem s) => Navigator.push(ctx, MaterialPageRoute(builder: (_) => WatchPage(stream: s, user: _user)));
}

// ========== HOME ==========

class HomePage extends StatelessWidget {
  final List<StreamItem> streams;
  final UserInfo? user;
  final VoidCallback onRefresh, onAuth;
  final void Function(StreamItem) onWatch;
  const HomePage({super.key, required this.streams, this.user, required this.onRefresh, required this.onAuth, required this.onWatch});

  @override
  Widget build(BuildContext context) {
    final live = streams.where((s) => s.isLive).toList();
    final offline = streams.where((s) => !s.isLive).toList();
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Container(width: 28, height: 28, decoration: BoxDecoration(borderRadius: BorderRadius.circular(6), gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFF2563EB)])),
            child: const Icon(Icons.play_arrow, color: Colors.white, size: 18)),
          const SizedBox(width: 8),
          const Text('Streeming', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        ]),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: onRefresh),
          if (user == null) TextButton(onPressed: onAuth, child: const Text('Увійти')),
        ],
      ),
      body: RefreshIndicator(onRefresh: () async => onRefresh(), child: ListView(padding: const EdgeInsets.all(12), children: [
        if (live.isNotEmpty) ...[
          _SectionHeader(title: '🔴 LIVE', count: live.length),
          ...live.map((s) => StreamCard(stream: s, onTap: () => onWatch(s))),
          const SizedBox(height: 16),
        ],
        _SectionHeader(title: 'Рекомендовані', count: offline.length),
        if (offline.isEmpty) const Padding(padding: EdgeInsets.all(32), child: Center(child: Text('Немає стрімів', style: TextStyle(color: kMuted)))),
        ...offline.map((s) => StreamCard(stream: s, onTap: () => onWatch(s))),
      ])),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title; final int count;
  const _SectionHeader({required this.title, required this.count});
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)), const SizedBox(width: 6), Text('$count', style: const TextStyle(color: kMuted, fontSize: 13))]));
}

// ========== STREAM CARD ==========

class StreamCard extends StatelessWidget {
  final StreamItem stream;
  final VoidCallback onTap;
  const StreamCard({super.key, required this.stream, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias, margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: InkWell(onTap: onTap, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        AspectRatio(aspectRatio: 16 / 9, child: Container(color: kSurface2,
          child: Stack(children: [
            if (stream.thumbnailUrl != null) Positioned.fill(child: Image.network('$apiBase${stream.thumbnailUrl}', fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox())),
            Center(child: Icon(Icons.play_arrow, size: 40, color: Colors.white.withOpacity(0.2))),
            if (stream.isLive) Positioned(top: 6, left: 6, child: Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: kDanger, borderRadius: BorderRadius.circular(4)), child: const Text('LIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white)))),
            if (stream.mature) Positioned(top: 6, right: 6, child: Container(padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1), decoration: BoxDecoration(color: kDanger, borderRadius: BorderRadius.circular(3)), child: const Text('18+', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white)))),
          ]))),
        Padding(padding: const EdgeInsets.all(10), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(stream.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Text('Streamer #${stream.userId.substring(0, 6)}', style: const TextStyle(color: kMuted, fontSize: 12)),
          const SizedBox(height: 4),
          Wrap(spacing: 4, runSpacing: 4, children: [
            _Tag(stream.isLive ? 'Наживо' : 'Офлайн', stream.isLive ? kDanger : kSurface2),
            if (stream.category != 'other') _Tag(stream.category, kBrand),
            ...stream.tags.take(2).map((t) => _Tag('#$t', Colors.transparent, border: true)),
          ]),
        ])),
      ])),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label; final Color bg; final bool border;
  const _Tag(this.label, this.bg, {this.border = false});
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
    decoration: BoxDecoration(color: border ? null : bg, borderRadius: BorderRadius.circular(99), border: border ? Border.all(color: kBrand.withOpacity(0.5)) : null),
    child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: border ? kBrand : Colors.white)));
}

// ========== BROWSE ==========

class BrowsePage extends StatelessWidget {
  final List<StreamItem> streams;
  final void Function(StreamItem) onWatch;
  const BrowsePage({super.key, required this.streams, required this.onWatch});

  static const cats = {'gaming': '🎮', 'irl': '📷', 'music': '🎵', 'esports': '🏆', 'creative': '🎨', 'education': '📚', 'talkshow': '🎙️', 'other': '📺'};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Огляд')),
      body: ListView(padding: const EdgeInsets.all(12), children: [
        Wrap(spacing: 8, runSpacing: 8, children: cats.entries.map((e) {
          final count = streams.where((s) => s.category == e.key).length;
          return ChoiceChip(label: Text('${e.value} ${e.key} ($count)'), selected: false, onSelected: (_) {});
        }).toList()),
        const SizedBox(height: 16),
        ...cats.keys.where((c) => streams.any((s) => s.category == c)).map((c) {
          final cs = streams.where((s) => s.category == c).toList();
          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(padding: const EdgeInsets.only(bottom: 6, top: 8), child: Text('${cats[c]} $c (${cs.length})', style: const TextStyle(fontWeight: FontWeight.bold))),
            ...cs.map((s) => StreamCard(stream: s, onTap: () => onWatch(s))),
          ]);
        }),
      ]),
    );
  }
}

// ========== DASHBOARD ==========

class DashboardPage extends StatefulWidget {
  final List<StreamItem> streams; final String userId; final VoidCallback onRefresh;
  const DashboardPage({super.key, required this.streams, required this.userId, required this.onRefresh});
  @override State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final _showKeys = <String>{};

  @override
  Widget build(BuildContext context) {
    final my = widget.streams.where((s) => s.userId == widget.userId).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Панель керування'), actions: [
        IconButton(icon: const Icon(Icons.add), onPressed: () => _showCreate(context)),
      ]),
      body: my.isEmpty
        ? const Center(child: Text('Немає стрімів', style: TextStyle(color: kMuted)))
        : ListView(padding: const EdgeInsets.all(12), children: my.map((s) => _dashCard(context, s)).toList()),
    );
  }

  Widget _dashCard(BuildContext ctx, StreamItem s) {
    return Card(margin: const EdgeInsets.only(bottom: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: BorderSide(color: s.isLive ? kDanger : kBorder)),
      child: Padding(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 4),
            Wrap(spacing: 4, children: [
              _Tag(s.isLive ? 'LIVE' : 'Офлайн', s.isLive ? kDanger : kSurface2),
              if (s.category != 'other') _Tag(s.category, kBrand),
            ]),
          ])),
          s.isLive
            ? FilledButton.icon(onPressed: () async { await api.stopStream(s.id); widget.onRefresh(); }, icon: const Icon(Icons.stop, size: 16), label: const Text('Стоп'), style: FilledButton.styleFrom(backgroundColor: kSurface2))
            : FilledButton.icon(onPressed: () async { await api.startStream(s.id); widget.onRefresh(); }, icon: const Icon(Icons.play_arrow, size: 16), label: const Text('Go Live'), style: FilledButton.styleFrom(backgroundColor: kDanger)),
        ]),
        const Divider(height: 20),
        Text('OBS', style: TextStyle(fontSize: 11, color: kMuted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        _keyRow('URL сервера', s.ingestUrl ?? '—', true),
        _keyRow('Ключ стріму', _showKeys.contains(s.id) ? (s.streamKey ?? '—') : '••••••••••••••', false,
          trailing: IconButton(icon: Icon(_showKeys.contains(s.id) ? Icons.visibility_off : Icons.visibility, size: 18),
            onPressed: () => setState(() { _showKeys.contains(s.id) ? _showKeys.remove(s.id) : _showKeys.add(s.id); }))),
        const Divider(height: 20),
        Text('Налаштування', style: TextStyle(fontSize: 11, color: kMuted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Wrap(spacing: 6, runSpacing: 6, children: [
          _settingChip('Якість', s.maxQuality),
          _settingChip('Затримка', '${s.delay}s'),
          _settingChip('18+', s.mature ? '✅' : '—'),
          _settingChip('Slow', '${s.settings['chat_slow_mode'] ?? 0}s'),
        ]),
        const SizedBox(height: 8),
        Align(alignment: Alignment.centerRight, child: TextButton.icon(
          onPressed: () async { await api.deleteStream(s.id); widget.onRefresh(); },
          icon: const Icon(Icons.delete_outline, size: 16, color: kDanger), label: const Text('Видалити', style: TextStyle(color: kDanger)))),
      ])));
  }

  Widget _keyRow(String label, String value, bool copyable, {Widget? trailing}) {
    return Padding(padding: const EdgeInsets.only(bottom: 4), child: Row(children: [
      SizedBox(width: 90, child: Text(label, style: const TextStyle(fontSize: 11, color: kMuted))),
      Expanded(child: Text(value, style: const TextStyle(fontSize: 12, fontFamily: 'monospace'), overflow: TextOverflow.ellipsis)),
      if (trailing != null) trailing,
    ]));
  }

  Widget _settingChip(String l, String v) => Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(color: kSurface2, borderRadius: BorderRadius.circular(6)),
    child: Column(children: [Text(l, style: const TextStyle(fontSize: 9, color: kMuted)), Text(v, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold))]));

  void _showCreate(BuildContext ctx) {
    final titleC = TextEditingController();
    final descC = TextEditingController();
    String cat = 'gaming';
    String quality = '1080p';
    showModalBottomSheet(context: ctx, isScrollControlled: true, backgroundColor: kSurface, shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (bCtx) => StatefulBuilder(builder: (sCtx, setSt) => Padding(padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(sCtx).viewInsets.bottom + 20),
        child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('Створити стрім', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          const SizedBox(height: 14),
          TextField(controller: titleC, decoration: const InputDecoration(labelText: 'Назва *', border: OutlineInputBorder())),
          const SizedBox(height: 10),
          TextField(controller: descC, maxLines: 2, decoration: const InputDecoration(labelText: 'Опис', border: OutlineInputBorder())),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: DropdownButtonFormField<String>(value: cat, decoration: const InputDecoration(labelText: 'Категорія', border: OutlineInputBorder(), isDense: true),
              items: BrowsePage.cats.keys.map((c) => DropdownMenuItem(value: c, child: Text('${BrowsePage.cats[c]} $c'))).toList(), onChanged: (v) => setSt(() => cat = v!))),
            const SizedBox(width: 10),
            Expanded(child: DropdownButtonFormField<String>(value: quality, decoration: const InputDecoration(labelText: 'Якість', border: OutlineInputBorder(), isDense: true),
              items: ['source', '1080p', '720p', '480p', '360p'].map((q) => DropdownMenuItem(value: q, child: Text(q))).toList(), onChanged: (v) => setSt(() => quality = v!))),
          ]),
          const SizedBox(height: 14),
          FilledButton(onPressed: () async {
            if (titleC.text.trim().length < 3) return;
            await api.createStream({'title': titleC.text.trim(), 'description': descC.text.trim(), 'category': cat, 'max_quality': quality});
            Navigator.pop(bCtx); widget.onRefresh();
          }, child: const Text('Створити')),
        ])))));
  }
}

// ========== PROFILE ==========

class ProfilePage extends StatelessWidget {
  final UserInfo? user; final VoidCallback onAuth, onLogout;
  const ProfilePage({super.key, this.user, required this.onAuth, required this.onLogout});
  @override
  Widget build(BuildContext context) {
    if (user == null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.person_outline, size: 64, color: kMuted),
      const SizedBox(height: 12),
      FilledButton(onPressed: onAuth, child: const Text('Увійти')),
    ]));
    return Scaffold(appBar: AppBar(title: const Text('Профіль')),
      body: Padding(padding: const EdgeInsets.all(24), child: Column(children: [
        CircleAvatar(radius: 36, backgroundColor: kBrand, child: Text(user!.email[0].toUpperCase(), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white))),
        const SizedBox(height: 12),
        Text(user!.email, style: const TextStyle(fontSize: 16)),
        Text(user!.role, style: const TextStyle(color: kMuted)),
        const Spacer(),
        OutlinedButton.icon(onPressed: onLogout, icon: const Icon(Icons.logout), label: const Text('Вийти'), style: OutlinedButton.styleFrom(foregroundColor: kDanger)),
      ])));
  }
}

// ========== AUTH ==========

class AuthPage extends StatefulWidget {
  final void Function(UserInfo) onSuccess;
  const AuthPage({super.key, required this.onSuccess});
  @override State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  final _eC = TextEditingController(), _pC = TextEditingController();
  bool _loading = false; String? _error;

  Future<void> _submit(bool reg) async {
    if (_eC.text.trim().isEmpty || _pC.text.length < 8) { setState(() => _error = 'Email + пароль (мін. 8)'); return; }
    setState(() { _loading = true; _error = null; });
    try { final u = reg ? await api.register(_eC.text.trim(), _pC.text) : await api.login(_eC.text.trim(), _pC.text); widget.onSuccess(u); }
    catch (e) { if (mounted) setState(() => _error = '$e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override void dispose() { _eC.dispose(); _pC.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Вхід')),
    body: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      TextField(controller: _eC, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()), keyboardType: TextInputType.emailAddress),
      const SizedBox(height: 12),
      TextField(controller: _pC, obscureText: true, decoration: const InputDecoration(labelText: 'Пароль', border: OutlineInputBorder())),
      if (_error != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text(_error!, style: const TextStyle(color: kDanger))),
      const SizedBox(height: 20),
      Row(children: [
        Expanded(child: FilledButton(onPressed: _loading ? null : () => _submit(false), child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Увійти'))),
        const SizedBox(width: 12),
        Expanded(child: OutlinedButton(onPressed: _loading ? null : () => _submit(true), child: const Text('Реєстрація'))),
      ]),
    ])));
}

// ========== WATCH ==========

class WatchPage extends StatefulWidget {
  final StreamItem stream; final UserInfo? user;
  const WatchPage({super.key, required this.stream, this.user});
  @override State<WatchPage> createState() => _WatchPageState();
}

class _WatchPageState extends State<WatchPage> {
  VideoPlayerController? _player;
  String? _error;
  String _quality = 'auto';

  @override void initState() { super.initState(); _init(); }
  Future<void> _init() async {
    try { final c = VideoPlayerController.networkUrl(Uri.parse(sampleHls)); await c.initialize(); c.play(); setState(() => _player = c); }
    catch (e) { setState(() => _error = '$e'); }
  }
  @override void dispose() { _player?.dispose(); super.dispose(); }

  List<String> get _qualities {
    final all = ['source', '1080p', '720p', '480p', '360p'];
    final max = all.indexOf(widget.stream.maxQuality);
    return ['auto', ...all.sublist(max < 0 ? 0 : max)];
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.stream;
    return Scaffold(
      appBar: AppBar(title: Text(s.title, overflow: TextOverflow.ellipsis), actions: [
        if (s.isLive) const Chip(label: Text('LIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800)), backgroundColor: kDanger, padding: EdgeInsets.zero),
        PopupMenuButton<String>(icon: const Icon(Icons.settings), onSelected: (q) => setState(() => _quality = q),
          itemBuilder: (_) => _qualities.map((q) => PopupMenuItem(value: q, child: Row(children: [
            Text(q == 'auto' ? 'Авто ✨' : q == 'source' ? 'Оригінал' : q),
            if (_quality == q) const Padding(padding: EdgeInsets.only(left: 8), child: Icon(Icons.check, size: 16, color: kBrand)),
          ]))).toList()),
      ]),
      body: Column(children: [
        _error != null ? Container(height: 200, color: kSurface2, child: Center(child: Text(_error!, style: const TextStyle(color: kMuted))))
        : _player != null && _player!.value.isInitialized
          ? AspectRatio(aspectRatio: _player!.value.aspectRatio, child: VideoPlayer(_player!))
          : const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
        Padding(padding: const EdgeInsets.all(10), child: Row(children: [
          CircleAvatar(radius: 18, backgroundColor: kBrand, child: Text(s.title[0], style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white))),
          const SizedBox(width: 8),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
            Wrap(spacing: 4, children: [
              if (s.category != 'other') _Tag(s.category, kBrand),
              if (s.delay > 0) _Tag('⏱ ${s.delay}s', kSurface2),
              if (s.mature) _Tag('18+', kDanger),
              Text('Якість: $_quality', style: const TextStyle(fontSize: 10, color: kMuted)),
            ]),
          ])),
        ])),
        Expanded(child: ChatWidget(streamId: s.id, token: api.token)),
      ]),
    );
  }
}

// ========== CHAT (real WebSocket) ==========

class ChatWidget extends StatefulWidget {
  final String streamId; final String? token;
  const ChatWidget({super.key, required this.streamId, this.token});
  @override State<ChatWidget> createState() => _ChatWidgetState();
}

class _ChatWidgetState extends State<ChatWidget> {
  final _msgC = TextEditingController();
  final _scrollC = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  WebSocketChannel? _channel;
  bool _connected = false;

  static const _nameColors = [Color(0xFFFF4500), Color(0xFF1E90FF), Color(0xFF00FF7F), Color(0xFFFF69B4), Color(0xFF9ACD32), Color(0xFFDAA520), Color(0xFF8A2BE2), Color(0xFF00CEC9)];
  Color _color(String? id) { if (id == null) return kMuted; int h = 0; for (var c in id.codeUnits) h = c + ((h << 5) - h); return _nameColors[h.abs() % _nameColors.length]; }

  @override void initState() { super.initState(); _connect(); }

  void _connect() {
    var url = '$wsBase/chat/${widget.streamId}';
    if (widget.token != null) url += '?token=${Uri.encodeComponent(widget.token!)}';
    _channel = WebSocketChannel.connect(Uri.parse(url));
    _channel!.stream.listen((data) {
      try {
        final m = jsonDecode(data as String) as Map<String, dynamic>;
        setState(() { _messages.add(m); if (_messages.length > 200) _messages.removeAt(0); });
        Future.delayed(const Duration(milliseconds: 50), () { if (_scrollC.hasClients) _scrollC.animateTo(_scrollC.position.maxScrollExtent, duration: const Duration(milliseconds: 150), curve: Curves.easeOut); });
      } catch (_) {}
    }, onDone: () => setState(() => _connected = false));
    setState(() => _connected = true);
  }

  void _send() {
    final t = _msgC.text.trim();
    if (t.isEmpty || t.length > 500 || _channel == null) return;
    _channel!.sink.add(t);
    _msgC.clear();
  }

  @override void dispose() { _channel?.sink.close(); _msgC.dispose(); _scrollC.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), color: kSurface,
        child: Row(children: [const Icon(Icons.chat_bubble_outline, size: 14), const SizedBox(width: 6), const Text('Чат', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const Spacer(), Container(width: 7, height: 7, decoration: BoxDecoration(shape: BoxShape.circle, color: _connected ? Colors.green : kDanger))])),
      Expanded(child: _messages.isEmpty
        ? const Center(child: Text('Напишіть перше повідомлення', style: TextStyle(color: kMuted, fontSize: 13)))
        : ListView.builder(controller: _scrollC, padding: const EdgeInsets.all(6), itemCount: _messages.length, itemBuilder: (_, i) {
            final m = _messages[i]; final name = m['userName'] ?? (m['userId'] != null ? (m['userId'] as String).substring(0, 8) : 'Гість');
            return Padding(padding: const EdgeInsets.only(bottom: 2), child: RichText(text: TextSpan(style: const TextStyle(fontSize: 13), children: [
              TextSpan(text: '$name', style: TextStyle(fontWeight: FontWeight.bold, color: _color(m['userId'] as String?))),
              const TextSpan(text: ': ', style: TextStyle(color: kMuted)),
              TextSpan(text: m['message'] as String, style: const TextStyle(color: kText)),
            ])));
          })),
      Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(border: Border(top: BorderSide(color: kBorder))),
        child: Row(children: [
          Expanded(child: TextField(controller: _msgC, maxLength: 500, style: const TextStyle(fontSize: 13),
            decoration: InputDecoration(hintText: _connected ? 'Повідомлення…' : 'З\'єднання…', border: const OutlineInputBorder(), counterText: '', isDense: true, contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
            enabled: _connected, onSubmitted: (_) => _send())),
          const SizedBox(width: 6),
          IconButton.filled(onPressed: _send, icon: const Icon(Icons.send, size: 16), style: IconButton.styleFrom(backgroundColor: kBrand)),
        ])),
    ]);
  }
}
