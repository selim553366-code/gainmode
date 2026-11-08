import SwiftUI
import WidgetKit
import UIKit

private let sharedGroup = "group.com.forgefit2.app"

// MARK: - Data written by the app (widgets/widgetModels.ts → createWidgetModel)

private struct WorkoutSummary: Decodable {
  let id: String?
  let name: String?
  let completed: Bool?
}

private struct MacroSummary: Decodable {
  let key: String
  let eaten: Double?
  let goal: Double?
}

private struct PlanDay: Decodable {
  let label: String
  let dayNumber: Int
  let isToday: Bool
  let hasWorkout: Bool
  let done: Bool
}

private struct GainModeData: Decodable {
  let language: String?
  let todayWorkout: WorkoutSummary?
  let todayWorkoutName: String?
  let nextWorkoutName: String?
  let todayWorkoutDuration: Double?
  let completedExercises: Double?
  let exerciseCount: Double?
  let currentStreak: Double?
  let streakTierLabel: String?
  let caloriesEaten: Double?
  let calorieGoal: Double?
  let caloriesLeft: Double?
  let calorieProgress: Double?
  let macros: [MacroSummary]?
  let planWeek: [PlanDay]?
  let workoutsDoneThisWeek: Double?
  let workoutsThisWeek: Double?
  let nextBadgeId: String?
  let nextBadgeTier: String?
  let nextBadgeTitle: String?
  let nextBadgeProgress: Double?
  let nextBadgeRemaining: Double?
  let quote: String?
}

private struct GainModeEntry: TimelineEntry {
  let date: Date
  let kind: String
  let data: GainModeData?
}

private struct GainModeProvider: TimelineProvider {
  let kind: String

  private func entry(at date: Date) -> GainModeEntry {
    let raw = UserDefaults(suiteName: sharedGroup)?.string(forKey: "gainmode-widget-model")
    let data = raw.flatMap { $0.data(using: .utf8) }.flatMap { try? JSONDecoder().decode(GainModeData.self, from: $0) }
    return GainModeEntry(date: date, kind: kind, data: data)
  }

  func placeholder(in context: Context) -> GainModeEntry { entry(at: Date()) }

  func getSnapshot(in context: Context, completion: @escaping (GainModeEntry) -> Void) {
    completion(entry(at: Date()))
  }

  // The app reloads the widgets whenever its data changes; the timeline only has to roll over at midnight.
  func getTimeline(in context: Context, completion: @escaping (Timeline<GainModeEntry>) -> Void) {
    let now = Date()
    let nextMidnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
    let entries = [entry(at: now), GainModeEntry(date: nextMidnight, kind: kind, data: entry(at: nextMidnight).data)]
    completion(Timeline(entries: entries, policy: .after(nextMidnight)))
  }
}

// MARK: - Words

private struct WidgetWords {
  let calories, kcalLeft, kcalOver, setGoal, protein, carbs, fat: String
  let todaysWorkout, start, done, rest, next, min, exercises: String
  let streak, days, startStreak, week, nextBadge, toGo, allBadges: String
  let titleCalories, titleWorkout, titleStreak, titleWeek, titleBadge, titleFitBud: String

  static func forLanguage(_ code: String) -> WidgetWords {
    switch code {
    case "tr": return .init(calories: "KALORİ", kcalLeft: "kcal kaldı", kcalOver: "kcal fazla", setGoal: "Hedefini belirle", protein: "Protein", carbs: "Karb.", fat: "Yağ", todaysWorkout: "BUGÜNÜN ANTRENMANI", start: "Başla", done: "Tamamlandı", rest: "Dinlenme günü", next: "Sıradaki", min: "dk", exercises: "hareket", streak: "SERİ", days: "gün", startStreak: "Bugün başla", week: "BU HAFTA", nextBadge: "SIRADAKİ ROZET", toGo: "kaldı", allBadges: "Tüm rozetler senin", titleCalories: "Kalori", titleWorkout: "Bugünün antrenmanı", titleStreak: "Seri", titleWeek: "Bu hafta", titleBadge: "Sıradaki rozet", titleFitBud: "FitBud")
    case "de": return .init(calories: "KALORIEN", kcalLeft: "kcal übrig", kcalOver: "kcal drüber", setGoal: "Ziel festlegen", protein: "Protein", carbs: "Kohlenh.", fat: "Fett", todaysWorkout: "HEUTIGES TRAINING", start: "Start", done: "Erledigt", rest: "Ruhetag", next: "Nächstes", min: "Min.", exercises: "Übungen", streak: "SERIE", days: "Tage", startStreak: "Heute starten", week: "DIESE WOCHE", nextBadge: "NÄCHSTES ABZEICHEN", toGo: "übrig", allBadges: "Alle Abzeichen gehören dir", titleCalories: "Kalorien", titleWorkout: "Heutiges Training", titleStreak: "Serie", titleWeek: "Diese Woche", titleBadge: "Nächstes Abzeichen", titleFitBud: "FitBud")
    case "fr": return .init(calories: "CALORIES", kcalLeft: "kcal restantes", kcalOver: "kcal en trop", setGoal: "Fixe ton objectif", protein: "Protéines", carbs: "Glucides", fat: "Lipides", todaysWorkout: "SÉANCE DU JOUR", start: "Go", done: "Terminé", rest: "Jour de repos", next: "Prochaine", min: "min", exercises: "exercices", streak: "SÉRIE", days: "jours", startStreak: "Commence aujourd’hui", week: "CETTE SEMAINE", nextBadge: "PROCHAIN BADGE", toGo: "restants", allBadges: "Tous les badges sont à toi", titleCalories: "Calories", titleWorkout: "Séance du jour", titleStreak: "Série", titleWeek: "Cette semaine", titleBadge: "Prochain badge", titleFitBud: "FitBud")
    case "es": return .init(calories: "CALORÍAS", kcalLeft: "kcal restantes", kcalOver: "kcal de más", setGoal: "Fija tu objetivo", protein: "Proteína", carbs: "Carbos", fat: "Grasa", todaysWorkout: "ENTRENO DE HOY", start: "Empezar", done: "Hecho", rest: "Día de descanso", next: "Siguiente", min: "min", exercises: "ejercicios", streak: "RACHA", days: "días", startStreak: "Empieza hoy", week: "ESTA SEMANA", nextBadge: "PRÓXIMA INSIGNIA", toGo: "restantes", allBadges: "Todas las insignias son tuyas", titleCalories: "Calorías", titleWorkout: "Entreno de hoy", titleStreak: "Racha", titleWeek: "Esta semana", titleBadge: "Próxima insignia", titleFitBud: "FitBud")
    default: return .init(calories: "CALORIES", kcalLeft: "kcal left", kcalOver: "kcal over", setGoal: "Set your goal", protein: "Protein", carbs: "Carbs", fat: "Fat", todaysWorkout: "TODAY’S WORKOUT", start: "Start", done: "Done", rest: "Rest day", next: "Next", min: "min", exercises: "exercises", streak: "STREAK", days: "days", startStreak: "Start today", week: "THIS WEEK", nextBadge: "NEXT BADGE", toGo: "to go", allBadges: "Every badge is yours", titleCalories: "Calories", titleWorkout: "Today’s workout", titleStreak: "Streak", titleWeek: "This week", titleBadge: "Next badge", titleFitBud: "FitBud")
    }
  }

  func title(for kind: String) -> String {
    switch kind {
    case "Calories": return titleCalories
    case "StartWorkout": return titleWorkout
    case "Streak": return titleStreak
    case "WeeklyConsistency": return titleWeek
    case "NextGoal": return titleBadge
    default: return titleFitBud
    }
  }
}

// MARK: - Look

private extension Color {
  init(hex: UInt32) {
    self.init(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
  }
}

private struct Palette {
  let card, ink, muted, accent, track, success, orange: Color

  static func make(_ scheme: ColorScheme) -> Palette {
    scheme == .dark
      ? Palette(card: Color(hex: 0x141619), ink: .white, muted: Color(hex: 0x9AA4B8), accent: Color(hex: 0x3B82F6), track: Color(hex: 0x2A2F3A), success: Color(hex: 0x22C55E), orange: Color(hex: 0xFF6A2B))
      : Palette(card: .white, ink: Color(hex: 0x0B1530), muted: Color(hex: 0x5B6B88), accent: Color(hex: 0x2563EB), track: Color(hex: 0xE6EDF8), success: Color(hex: 0x22C55E), orange: Color(hex: 0xFF6A2B))
  }
}

/// Inter is bundled with the extension (UIAppFonts); SwiftUI falls back to the system font if it is missing.
private func heavy(_ size: CGFloat) -> Font { .custom("Inter-ExtraBold", size: size) }
private func semi(_ size: CGFloat) -> Font { .custom("Inter-SemiBold", size: size) }

private func bundleImage(_ name: String) -> UIImage? {
  guard let path = Bundle.main.path(forResource: name, ofType: "png") else { return nil }
  return UIImage(contentsOfFile: path)
}

private func tierColor(_ tier: String?) -> Color {
  switch tier {
  case "bronze": return Color(hex: 0xC98C54)
  case "silver": return Color(hex: 0x9AA4B8)
  case "platinum": return Color(hex: 0x7FA6CC)
  case "legendary": return Color(hex: 0x9B6BF0)
  default: return Color(hex: 0xE8B23A)
  }
}

private struct ProgressBar: View {
  let progress: Double
  let color: Color
  let track: Color
  var height: CGFloat = 6

  var body: some View {
    GeometryReader { proxy in
      ZStack(alignment: .leading) {
        Capsule().fill(track)
        Capsule().fill(color).frame(width: max(progress > 0 ? height : 0, proxy.size.width * min(1, max(0, progress))))
      }
    }
    .frame(height: height)
  }
}

private struct Eyebrow: View {
  let text: String
  let color: Color
  var body: some View {
    Text(text).font(heavy(10)).tracking(0.6).foregroundStyle(color).lineLimit(1)
  }
}

// MARK: - Cards

private struct CaloriesView: View {
  let data: GainModeData?
  let words: WidgetWords
  let p: Palette
  let wide: Bool

  var body: some View {
    let goal = data?.calorieGoal
    let eaten = data?.caloriesEaten ?? 0
    let over = goal != nil && eaten > (goal ?? 0)
    let big = goal == nil ? "—" : String(Int(over ? eaten - (goal ?? 0) : (data?.caloriesLeft ?? 0)))
    let progress = data?.calorieProgress ?? 0
    VStack(alignment: .leading, spacing: 8) {
      HStack(alignment: .center) {
        VStack(alignment: .leading, spacing: 0) {
          Eyebrow(text: words.calories, color: p.muted)
          Text(big).font(heavy(wide ? 38 : 30)).foregroundStyle(over ? p.orange : p.ink).minimumScaleFactor(0.6).lineLimit(1)
          Text(goal == nil ? words.setGoal : over ? words.kcalOver : words.kcalLeft).font(semi(11)).foregroundStyle(p.muted).lineLimit(1)
        }
        Spacer(minLength: 4)
        ZStack {
          Circle().stroke(p.track, lineWidth: 6)
          Circle().trim(from: 0, to: min(1, max(0, progress)))
            .stroke(over ? p.orange : p.accent, style: StrokeStyle(lineWidth: 6, lineCap: .round))
            .rotationEffect(.degrees(-90))
          Text("\(Int((progress * 100).rounded()))%").font(heavy(12)).foregroundStyle(p.ink)
        }
        .frame(width: wide ? 64 : 48, height: wide ? 64 : 48)
      }
      VStack(spacing: 4) {
        ForEach(Array((data?.macros ?? []).enumerated()), id: \.offset) { item in
          let macro = item.element
          let label = macro.key == "protein" ? words.protein : macro.key == "carbs" ? words.carbs : words.fat
          let color = macro.key == "protein" ? p.accent : macro.key == "carbs" ? p.success : p.orange
          HStack(spacing: 6) {
            Text(label).font(semi(10)).foregroundStyle(p.muted).frame(width: wide ? 58 : 44, alignment: .leading).lineLimit(1)
            ProgressBar(progress: (macro.goal ?? 0) > 0 ? (macro.eaten ?? 0) / (macro.goal ?? 1) : 0, color: color, track: p.track, height: 5)
            if wide {
              Text(macro.goal != nil ? "\(Int(macro.eaten ?? 0))/\(Int(macro.goal ?? 0)) g" : "\(Int(macro.eaten ?? 0)) g")
                .font(semi(10)).foregroundStyle(p.ink).lineLimit(1)
            }
          }
        }
      }
    }
  }
}

private struct WorkoutView: View {
  let data: GainModeData?
  let words: WidgetWords
  let p: Palette

  var body: some View {
    let workout = data?.todayWorkout
    let pending = workout != nil && workout?.completed != true
    let total = Int(data?.exerciseCount ?? 0)
    let done = Int(data?.completedExercises ?? 0)
    let segments = max(1, min(12, total))
    let filled = total > 0 ? Int((Double(done) / Double(total) * Double(segments)).rounded()) : 0
    HStack(alignment: .center, spacing: 8) {
      VStack(alignment: .leading, spacing: 0) {
        Eyebrow(text: words.todaysWorkout, color: p.accent)
        Text(workout == nil ? words.rest : (data?.todayWorkoutName ?? "")).font(heavy(21)).foregroundStyle(p.ink).lineLimit(1).minimumScaleFactor(0.7)
        Text(workout == nil
          ? "\(words.next): \((data?.nextWorkoutName ?? "").isEmpty ? words.rest : (data?.nextWorkoutName ?? ""))"
          : "\(Int(data?.todayWorkoutDuration ?? 0)) \(words.min) · \(total) \(words.exercises)")
          .font(semi(11)).foregroundStyle(p.muted).lineLimit(1)
        Spacer(minLength: 6)
        if workout != nil {
          HStack(spacing: 3) {
            ForEach(0..<segments, id: \.self) { index in
              Capsule().fill(index < filled ? p.success : p.track).frame(height: 6)
            }
            Text("\(done)/\(total)").font(heavy(11)).foregroundStyle(p.ink).padding(.leading, 4)
          }
        }
        Spacer(minLength: 6)
        if pending {
          HStack(spacing: 10) {
            Text(words.start).font(heavy(13)).foregroundStyle(p.card)
            RoundedRectangle(cornerRadius: 9).fill(p.card).frame(width: 26, height: 26)
              .overlay(Image(systemName: "arrow.right").font(.system(size: 12, weight: .bold)).foregroundStyle(p.ink))
          }
          .padding(.leading, 14).padding(.trailing, 4).padding(.vertical, 4)
          .background(Capsule().fill(p.ink))
        } else if workout?.completed == true {
          Text("✓ \(words.done)").font(heavy(12)).foregroundStyle(p.success)
        }
      }
      Spacer(minLength: 0)
      if let image = bundleImage("kettlebell") {
        Image(uiImage: image).resizable().scaledToFit().frame(maxWidth: 90, maxHeight: 110)
      }
    }
  }
}

private struct StreakView: View {
  let data: GainModeData?
  let words: WidgetWords
  let wide: Bool

  var body: some View {
    let streak = Int(data?.currentStreak ?? 0)
    VStack(alignment: .leading, spacing: 0) {
      Eyebrow(text: words.streak, color: Color(hex: 0xFFB547))
      Spacer(minLength: 0)
      HStack(alignment: .bottom, spacing: 4) {
        VStack(alignment: .leading, spacing: 0) {
          Text("\(streak)").font(heavy(wide ? 52 : 44)).foregroundStyle(.white).minimumScaleFactor(0.6).lineLimit(1)
          Text(streak > 0 ? words.days : words.startStreak).font(semi(12)).foregroundStyle(Color(hex: 0xC9CFDD)).lineLimit(1)
          if let tier = data?.streakTierLabel, !tier.isEmpty {
            Text(tier.uppercased())
              .font(heavy(10)).foregroundStyle(Color(hex: 0x3A1600))
              .padding(.horizontal, 9).padding(.vertical, 3)
              .background(Capsule().fill(LinearGradient(colors: [Color(hex: 0xFF7A2F), Color(hex: 0xFFB547)], startPoint: .leading, endPoint: .trailing)))
              .padding(.top, 6)
          }
        }
        Spacer(minLength: 0)
        if let image = bundleImage("fire") {
          Image(uiImage: image).resizable().scaledToFit().frame(maxWidth: wide ? 110 : 64, maxHeight: wide ? 110 : 84)
        }
      }
    }
  }
}

private struct WeekView: View {
  let data: GainModeData?
  let words: WidgetWords
  let p: Palette

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Eyebrow(text: words.week, color: p.accent)
        Spacer()
        Text("\(Int(data?.workoutsDoneThisWeek ?? 0))/\(Int(data?.workoutsThisWeek ?? 0))").font(heavy(12)).foregroundStyle(p.ink)
      }
      HStack(spacing: 6) {
        ForEach(Array((data?.planWeek ?? []).enumerated()), id: \.offset) { item in
          let day = item.element
          let shape = RoundedRectangle(cornerRadius: 30)
          VStack(spacing: 0) {
            Text(day.label).font(semi(10)).foregroundStyle(day.done ? .white : p.muted).lineLimit(1).minimumScaleFactor(0.7)
            Spacer(minLength: 2)
            Text("\(day.dayNumber)").font(heavy(16)).foregroundStyle(day.done ? .white : p.ink)
            Spacer(minLength: 2)
            Text(day.done ? "✓" : day.hasWorkout ? "•" : "☾").font(heavy(11)).foregroundStyle(day.done ? .white : day.hasWorkout ? p.accent : p.muted)
          }
          .padding(.vertical, 7)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .background(shape.fill(day.done ? p.accent : Color.clear))
          .overlay {
            if !day.done {
              if day.isToday {
                shape.strokeBorder(p.ink, lineWidth: 2)
              } else if day.hasWorkout {
                shape.strokeBorder(p.track, lineWidth: 1)
              } else {
                shape.strokeBorder(p.track, style: StrokeStyle(lineWidth: 1, dash: [3, 3]))
              }
            }
          }
        }
      }
    }
  }
}

private struct BadgeView: View {
  let data: GainModeData?
  let words: WidgetWords
  let p: Palette
  let wide: Bool

  var body: some View {
    let medal = data?.nextBadgeId.flatMap { bundleImage("medal-\($0)") }
    let details = VStack(alignment: .leading, spacing: 5) {
      if data?.nextBadgeId != nil {
        Text(data?.nextBadgeTitle ?? "").font(heavy(wide ? 16 : 13)).foregroundStyle(p.ink).lineLimit(2).minimumScaleFactor(0.8)
        ProgressBar(progress: data?.nextBadgeProgress ?? 0, color: tierColor(data?.nextBadgeTier), track: p.track)
        Text("\(Int(data?.nextBadgeRemaining ?? 0)) \(words.toGo)").font(semi(11)).foregroundStyle(p.muted)
      } else {
        Text(words.allBadges).font(heavy(14)).foregroundStyle(p.ink).lineLimit(2)
      }
    }
    VStack(alignment: .leading, spacing: 6) {
      Eyebrow(text: words.nextBadge, color: p.accent)
      if wide {
        HStack(spacing: 12) {
          if let medal { Image(uiImage: medal).resizable().scaledToFit().frame(width: 76, height: 76) }
          details
        }
        .frame(maxHeight: .infinity)
      } else {
        if let medal { Image(uiImage: medal).resizable().scaledToFit().frame(width: 50, height: 50) }
        Spacer(minLength: 0)
        details
      }
    }
  }
}

private struct FitBudView: View {
  let data: GainModeData?
  let date: Date
  let language: String
  let p: Palette

  var body: some View {
    let quote = (data?.quote).flatMap { $0.isEmpty ? nil : $0 } ?? QuoteBook.quote(for: date, language: language)
    HStack(spacing: 10) {
      if let image = bundleImage("fitbud") {
        Image(uiImage: image).resizable().scaledToFit().frame(maxWidth: 92)
      }
      VStack(alignment: .leading, spacing: 6) {
        Text("“\(quote)”").font(heavy(17)).foregroundStyle(p.ink).lineLimit(4).minimumScaleFactor(0.7)
        Text("— FitBud").font(semi(11)).foregroundStyle(p.accent)
      }
      Spacer(minLength: 0)
    }
  }
}

// MARK: - Widget

private struct GainModeWidgetView: View {
  @Environment(\.widgetFamily) private var family
  @Environment(\.colorScheme) private var colorScheme
  let entry: GainModeEntry

  private var language: String { entry.data?.language ?? QuoteBook.language }
  private var words: WidgetWords { .forLanguage(language) }
  private var p: Palette { .make(colorScheme) }
  private var wide: Bool { family != .systemSmall }

  private var destination: URL {
    switch entry.kind {
    case "Calories": return URL(string: "forge-fit://nutrition")!
    case "StartWorkout":
      if let workout = entry.data?.todayWorkout, workout.completed != true, let id = workout.id,
         let encoded = id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
         let url = URL(string: "forge-fit://workout-session?workoutId=\(encoded)") {
        return url
      }
      return URL(string: "forge-fit://plan")!
    case "Streak": return URL(string: "forge-fit://streak")!
    case "WeeklyConsistency": return URL(string: "forge-fit://plan")!
    case "NextGoal": return URL(string: "forge-fit://badge-wall")!
    default: return URL(string: "forge-fit://coach")!
    }
  }

  @ViewBuilder private var content: some View {
    switch entry.kind {
    case "Calories": CaloriesView(data: entry.data, words: words, p: p, wide: wide)
    case "StartWorkout": WorkoutView(data: entry.data, words: words, p: p)
    case "Streak": StreakView(data: entry.data, words: words, wide: wide)
    case "WeeklyConsistency": WeekView(data: entry.data, words: words, p: p)
    case "NextGoal": BadgeView(data: entry.data, words: words, p: p, wide: wide)
    default: FitBudView(data: entry.data, date: entry.date, language: language, p: p)
    }
  }

  var body: some View {
    if family == .accessoryRectangular {
      VStack(alignment: .leading, spacing: 2) {
        Text(words.title(for: entry.kind)).font(.system(size: 11, weight: .bold)).widgetAccentable()
        Text(accessoryLine).font(.system(size: 13, weight: .semibold)).lineLimit(2).minimumScaleFactor(0.8)
      }
      .containerBackground(for: .widget) { Color.clear }
      .widgetURL(destination)
    } else {
      content
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(for: .widget) {
          if entry.kind == "Streak" {
            LinearGradient(colors: [Color(hex: 0x121A3A), Color(hex: 0x1A1230), Color(hex: 0x3A1A10)], startPoint: .topLeading, endPoint: .bottomTrailing)
          } else {
            p.card
          }
        }
        .widgetURL(destination)
    }
  }

  private var accessoryLine: String {
    let data = entry.data
    switch entry.kind {
    case "Calories":
      return data?.calorieGoal == nil ? words.setGoal : "\(Int(data?.caloriesLeft ?? 0)) \(words.kcalLeft)"
    case "Streak": return "\(Int(data?.currentStreak ?? 0)) \(words.days)"
    case "NextGoal": return data?.nextBadgeTitle ?? words.allBadges
    case "StartWorkout": return data?.todayWorkout == nil ? words.rest : (data?.todayWorkoutName ?? "")
    case "WeeklyConsistency": return "\(Int(data?.workoutsDoneThisWeek ?? 0))/\(Int(data?.workoutsThisWeek ?? 0))"
    default: return data?.quote ?? QuoteBook.quote(for: entry.date, language: language)
    }
  }
}

/// Builds the configuration shared by every GainMode widget kind.
private func gainModeConfiguration(kind: String, families: [WidgetFamily]) -> some WidgetConfiguration {
  StaticConfiguration(kind: kind, provider: GainModeProvider(kind: kind)) { entry in
    GainModeWidgetView(entry: entry)
  }
  .configurationDisplayName(Text(WidgetWords.forLanguage(QuoteBook.language).title(for: kind)))
  .description(Text("GainMode"))
  .supportedFamilies(families)
}

// WidgetKit creates each widget with init(), so every kind is its own type.
private struct CaloriesWidget: Widget {
  var body: some WidgetConfiguration { gainModeConfiguration(kind: "Calories", families: [.systemSmall, .systemMedium, .accessoryRectangular]) }
}

private struct StartWorkoutWidget: Widget {
  var body: some WidgetConfiguration { gainModeConfiguration(kind: "StartWorkout", families: [.systemMedium, .accessoryRectangular]) }
}

private struct StreakWidget: Widget {
  var body: some WidgetConfiguration { gainModeConfiguration(kind: "Streak", families: [.systemSmall, .systemMedium, .accessoryRectangular]) }
}

private struct WeeklyConsistencyWidget: Widget {
  var body: some WidgetConfiguration { gainModeConfiguration(kind: "WeeklyConsistency", families: [.systemMedium]) }
}

private struct NextGoalWidget: Widget {
  var body: some WidgetConfiguration { gainModeConfiguration(kind: "NextGoal", families: [.systemSmall, .systemMedium, .accessoryRectangular]) }
}

private struct GainModeMotivationWidget: Widget {
  var body: some WidgetConfiguration { gainModeConfiguration(kind: "Motivation", families: [.systemMedium, .accessoryRectangular]) }
}

@main
struct GainModeWidgetBundle: WidgetBundle {
  var body: some Widget {
    CaloriesWidget()
    StartWorkoutWidget()
    StreakWidget()
    WeeklyConsistencyWidget()
    NextGoalWidget()
    GainModeMotivationWidget()
  }
}
