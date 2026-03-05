import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { LibraryItem } from "@/lib/storage";

type Filter = "all" | "note" | "summary" | "exam";

const TYPE_CONFIG = {
  note: { icon: "document-text", color: COLORS.primary, label: "Notes" },
  summary: { icon: "list", color: COLORS.accent, label: "Summaries" },
  exam: { icon: "school", color: COLORS.danger, label: "Exams" },
};

function LibraryCard({ item, onDelete }: { item: LibraryItem; onDelete: () => void }) {
  const config = TYPE_CONFIG[item.type];
  const date = new Date(item.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={styles.card}
      onPress={() => { setExpanded(!expanded); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
    >
      <View style={[styles.cardTypeStripe, { backgroundColor: config.color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardTypeIcon, { backgroundColor: config.color + "20" }]}>
            <Ionicons name={config.icon as any} size={16} color={config.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={expanded ? undefined : 2}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.subject} · {date}</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Delete", "Remove this item from your library?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ]);
            }}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
          </Pressable>
        </View>
        <Text style={styles.cardPreview} numberOfLines={expanded ? undefined : 3}>{item.content}</Text>
        {!expanded && item.content.length > 200 && (
          <Text style={styles.readMore}>Tap to read more...</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { library, removeLibraryItem } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = useMemo(() => {
    let items = filter === "all" ? library : library.filter((i) => i.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.subject.toLowerCase().includes(q) ||
          i.content.toLowerCase().includes(q)
      );
    }
    return items;
  }, [library, filter, search]);

  const counts = useMemo(() => ({
    all: library.length,
    note: library.filter(i => i.type === "note").length,
    summary: library.filter(i => i.type === "summary").length,
    exam: library.filter(i => i.type === "exam").length,
  }), [library]);

  const handleDelete = async (id: string) => {
    await removeLibraryItem(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#0A0E1A"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Library</Text>
        <Pressable
          style={styles.searchToggleBtn}
          onPress={() => { setShowSearch(!showSearch); if (showSearch) setSearch(""); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Ionicons name={showSearch ? "close" : "search"} size={22} color={COLORS.text} />
        </Pressable>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, summaries, exams..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.filterRow}>
        {(["all", "note", "summary", "exam"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "All" : f === "note" ? "Notes" : f === "summary" ? "Summaries" : "Exams"}
            </Text>
            <View style={[styles.filterCount, filter === f && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, filter === f && styles.filterCountTextActive]}>
                {counts[f]}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name={search ? "search-outline" : "bookmark-outline"} size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>{search ? "No results found" : "Nothing here yet"}</Text>
          <Text style={styles.emptyText}>
            {search
              ? `No items match "${search}". Try a different search term.`
              : "Generate notes or summaries and save them to your library"}
          </Text>
          {!search && (
            <Pressable style={styles.emptyBtn} onPress={() => router.back()}>
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.emptyBtnGradient}>
                <Text style={styles.emptyBtnText}>Start Learning</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LibraryCard item={item} onDelete={() => handleDelete(item.id)} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            search ? (
              <Text style={styles.searchResultCount}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text, textAlign: "center" },
  searchToggleBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 4,
  },

  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  filterBtnActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  filterText: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.primary },
  filterCount: { backgroundColor: COLORS.border, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: "center" },
  filterCountActive: { backgroundColor: COLORS.primary + "30" },
  filterCountText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: COLORS.textMuted },
  filterCountTextActive: { color: COLORS.primary },

  searchResultCount: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, paddingBottom: 8 },

  card: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden", flexDirection: "row" },
  cardTypeStripe: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  cardTypeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.text, flex: 1 },
  cardMeta: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: { padding: 4 },
  cardPreview: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  readMore: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.primary, marginTop: 4 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  emptyBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  emptyBtnGradient: { paddingVertical: 14, paddingHorizontal: 32 },
  emptyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white },
});
