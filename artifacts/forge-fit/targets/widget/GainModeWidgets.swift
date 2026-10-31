import SwiftUI
import WidgetKit
import UIKit

private let sharedGroup = "group.com.forgefit2.app"

private struct StreakDay: Decodable {
  let date: String
  let isCompleted: Bool
}

private struct WorkoutSummary: Decodable {
  let name: String?
}

private struct BadgeSummary: Decodable {
  let target: Double?
}

private struct GainModeData: Decodable {
  let language: String
  let todayWorkout: WorkoutSummary?
  let nextWorkout: WorkoutSummary?
  let todayWorkoutName: String
  let nextWorkoutName: String
  let activeMinutes: Int
  let activeCalories: Int
  let workoutProgress: Double
  let completedExercises: Int
  let exerciseCount: Int
  let currentStreak: Int
  let streakWeek: [StreakDay]
  let quote: String
  let nextBadge: BadgeSummary?
  let nextBadgeTitle: String
  let nextBadgeProgress: Double
  let performanceBars: [Double]
  let currentWeekMinutes: Int
  let performanceChange: Int?
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

  func getTimeline(in context: Context, completion: @escaping (Timeline<GainModeEntry>) -> Void) {
    let now = Date()
    let calendar = Calendar.current
    let nextMidnight = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: now) ?? now)
    let hour = calendar.component(.hour, from: now)
    let nextEveningOrMorning: Date
    if hour < 6 {
      nextEveningOrMorning = calendar.date(bySettingHour: 6, minute: 0, second: 0, of: now) ?? nextMidnight
    } else if hour < 21 {
      nextEveningOrMorning = calendar.date(bySettingHour: 21, minute: 0, second: 0, of: now) ?? nextMidnight
    } else {
      let tomorrow = calendar.date(byAdding: .day, value: 1, to: now) ?? now
      nextEveningOrMorning = calendar.date(bySettingHour: 6, minute: 0, second: 0, of: tomorrow) ?? nextMidnight
    }
    let dates = Set([nextMidnight, nextEveningOrMorning])
    let entries = [GainModeEntry(date: now, kind: kind, data: entry(at: now).data)]
      + dates.sorted().map { GainModeEntry(date: $0, kind: kind, data: entry(at: $0).data) }
    completion(Timeline(entries: entries, policy: .after(min(nextMidnight, nextEveningOrMorning))))
  }
}

private struct WidgetWords {
  let progress: String
  let breathe: String
  let breatheHint: String
  let streak: String
  let days: String
  let today: String
  let workout: String
  let restDay: String
  let start: String
  let week: String
  let quote: String
  let nextGoal: String
  let performance: String
  let goodNight: String
  let recovery: String
  let open: String
  let calories: String
  let minutes: String

  static func forLanguage(_ code: String) -> WidgetWords {
    switch code {
    case "tr": return .init(progress: "Bugünkü ilerleme", breathe: "Nefes molası", breatheHint: "Bir dakika kendine dön", streak: "Günlük seri", days: "gün", today: "Bugün", workout: "Antrenman", restDay: "Dinlenme günü", start: "Antrenmana başla", week: "Bu hafta", quote: "Günün sözü", nextGoal: "Sıradaki hedef", performance: "Haftalık performans", goodNight: "İyi geceler", recovery: "Dinlen, yarın devam et", open: "Açmak için dokun", calories: "kcal", minutes: "dk")
    case "de": return .init(progress: "Heutiger Fortschritt", breathe: "Atempause", breatheHint: "Nimm dir eine Minute für dich", streak: "Tages-Serie", days: "Tage", today: "Heute", workout: "Training", restDay: "Ruhetag", start: "Training starten", week: "Diese Woche", quote: "Spruch des Tages", nextGoal: "Nächstes Ziel", performance: "Wochenleistung", goodNight: "Gute Nacht", recovery: "Ruh dich für morgen aus", open: "Zum Öffnen tippen", calories: "kcal", minutes: "Min.")
    case "fr": return .init(progress: "Progression du jour", breathe: "Pause respiration", breatheHint: "Prends une minute pour toi", streak: "Série quotidienne", days: "jours", today: "Aujourd’hui", workout: "Entraînement", restDay: "Jour de repos", start: "Commencer", week: "Cette semaine", quote: "La phrase du jour", nextGoal: "Prochain objectif", performance: "Performance hebdomadaire", goodNight: "Bonne nuit", recovery: "Repose-toi pour demain", open: "Toucher pour ouvrir", calories: "kcal", minutes: "min")
    case "es": return .init(progress: "Progreso de hoy", breathe: "Pausa para respirar", breatheHint: "Dedica un minuto a ti", streak: "Racha diaria", days: "días", today: "Hoy", workout: "Entrenamiento", restDay: "Día de descanso", start: "Empezar entrenamiento", week: "Esta semana", quote: "Frase del día", nextGoal: "Próximo objetivo", performance: "Rendimiento semanal", goodNight: "Buenas noches", recovery: "Descansa para mañana", open: "Toca para abrir", calories: "kcal", minutes: "min")
    default: return .init(progress: "Today's progress", breathe: "Breathing break", breatheHint: "Take a minute for yourself", streak: "Daily streak", days: "days", today: "Today", workout: "Workout", restDay: "Rest day", start: "Start workout", week: "This week", quote: "Today's quote", nextGoal: "Next goal", performance: "Weekly performance", goodNight: "Good night", recovery: "Rest up for tomorrow", open: "Tap to open", calories: "kcal", minutes: "min")
    }
  }

  func title(for kind: String) -> String {
    switch kind {
    case "TodayProgress": return progress
    case "Breathe": return breathe
    case "Streak": return streak
    case "StartWorkout": return start
    case "WeeklyConsistency": return week
    case "Motivation": return quote
    case "NextGoal": return nextGoal
    case "Performance": return performance
    default: return goodNight
    }
  }

  func description(for kind: String) -> String {
    switch kind {
    case "TodayProgress": return progress
    case "Breathe": return breatheHint
    case "Streak": return streak
    case "StartWorkout": return start
    case "WeeklyConsistency": return week
    case "Motivation": return quote
    case "NextGoal": return nextGoal
    case "Performance": return performance
    default: return recovery
    }
  }
}

private struct GainModeWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: GainModeEntry

  private var language: String { entry.data?.language ?? QuoteBook.language }
  private var words: WidgetWords { .forLanguage(language) }
  private var isNight: Bool {
    let hour = Calendar.current.component(.hour, from: entry.date)
    return hour >= 21 || hour < 6
  }
  private var destination: URL {
    let route: String
    switch entry.kind {
    case "TodayProgress", "Performance": route = "progress-charts"
    case "Breathe", "GoodNight": route = "breathe"
    case "Streak", "WeeklyConsistency": route = "streak"
    case "StartWorkout": route = "plan"
    case "NextGoal": route = "badge-wall"
    default: route = "coach"
    }
    return URL(string: "forge-fit://\(route)")!
  }
  private var mainValue: String {
    guard let data = entry.data else { return words.open }
    switch entry.kind {
    case "TodayProgress":
      return data.todayWorkout == nil ? words.restDay : "\(data.completedExercises)/\(data.exerciseCount)"
    case "Breathe": return "4 · 4 · 6"
    case "Streak": return "\(data.currentStreak) \(words.days)"
    case "StartWorkout": return data.nextWorkoutName.isEmpty ? words.restDay : data.nextWorkoutName
    case "WeeklyConsistency": return "\(data.currentStreak) \(words.days)"
    case "Motivation": return QuoteBook.quote(for: entry.date, language: language)
    case "NextGoal": return data.nextBadgeTitle.isEmpty ? words.nextGoal : data.nextBadgeTitle
    case "Performance": return "\(data.currentWeekMinutes) \(words.minutes)"
    default: return isNight ? words.recovery : words.goodNight
    }
  }
  private var subtitle: String {
    guard let data = entry.data else { return words.open }
    switch entry.kind {
    case "TodayProgress": return "\(data.activeCalories) \(words.calories) · \(data.activeMinutes) \(words.minutes)"
    case "Breathe": return words.breatheHint
    case "Streak": return words.open
    case "StartWorkout": return data.nextWorkout == nil ? words.restDay : words.start
    case "WeeklyConsistency": return words.week
    case "Motivation": return words.open
    case "NextGoal": return "\(Int((data.nextBadgeProgress * 100).rounded()))%"
    case "Performance":
      guard let change = data.performanceChange else { return words.open }
      return "\(change > 0 ? "+" : "")\(change)% · \(words.week)"
    default:
      let formatter = DateFormatter()
      formatter.locale = Locale(identifier: language)
      formatter.timeStyle = .short
      return "\(formatter.string(from: entry.date)) · \(words.open)"
    }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(entry.kind == "GoodNight" ? (isNight ? words.goodNight : words.recovery) : words.title(for: entry.kind))
        .font(.system(size: 12, weight: .bold))
        .foregroundStyle(.white.opacity(0.82))
        .lineLimit(1)

      HStack(alignment: .center, spacing: 6) {
        VStack(alignment: .leading, spacing: 6) {
          Text(mainValue)
            .font(.system(size: family == .systemSmall ? 18 : 22, weight: .bold, design: .rounded))
            .foregroundStyle(.white)
            .lineLimit(family == .systemSmall ? 3 : 2)
            .minimumScaleFactor(0.72)
          Text(subtitle)
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(.white.opacity(0.78))
            .lineLimit(2)
        }
        Spacer(minLength: 0)
        if family != .accessoryRectangular, let image = UIImage(contentsOfFile: Bundle.main.path(forResource: "coach", ofType: "png") ?? "") {
          Image(uiImage: image)
            .resizable()
            .scaledToFit()
            .frame(width: family == .systemSmall ? 52 : 72, height: family == .systemSmall ? 52 : 72)
        }
      }

      if entry.kind == "WeeklyConsistency", let days = entry.data?.streakWeek {
        HStack(spacing: 4) {
          ForEach(Array(days.enumerated()), id: \.offset) { item in
            Circle().fill(item.element.isCompleted ? Color.white : Color.white.opacity(0.3)).frame(width: 7, height: 7)
          }
        }
      }
      if entry.kind == "Performance", let bars = entry.data?.performanceBars {
        HStack(alignment: .bottom, spacing: 4) {
          ForEach(Array(bars.enumerated()), id: \.offset) { item in
            Capsule().fill(Color.white.opacity(0.82))
              .frame(width: 9, height: CGFloat(max(4, min(18, item.element / 2))))
          }
        }.frame(height: 20)
      }
      if entry.kind == "TodayProgress", let data = entry.data, data.todayWorkout != nil {
        ProgressView(value: min(1, max(0, data.workoutProgress)))
          .tint(.white)
          .scaleEffect(x: 1, y: 0.7, anchor: .center)
      }
      if entry.kind == "NextGoal", let data = entry.data {
        ProgressView(value: min(1, max(0, data.nextBadgeProgress)))
          .tint(.white)
          .scaleEffect(x: 1, y: 0.7, anchor: .center)
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .containerBackground(for: .widget) {
      LinearGradient(colors: [Color(red: 0.23, green: 0.48, blue: 0.95), Color(red: 0.11, green: 0.25, blue: 0.72)], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
    .widgetURL(destination)
  }
}

private struct GainModeStaticWidget: Widget {
  let kind: String
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GainModeProvider(kind: kind)) { entry in
      GainModeWidgetView(entry: entry)
    }
    .configurationDisplayName(Text(WidgetWords.forLanguage(QuoteBook.language).title(for: kind)))
    .description(Text(WidgetWords.forLanguage(QuoteBook.language).description(for: kind)))
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular])
  }
}

@main
struct GainModeWidgetBundle: WidgetBundle {
  var body: some Widget {
    GainModeStaticWidget(kind: "TodayProgress")
    GainModeStaticWidget(kind: "Breathe")
    GainModeStaticWidget(kind: "Streak")
    GainModeStaticWidget(kind: "StartWorkout")
    GainModeStaticWidget(kind: "WeeklyConsistency")
    GainModeStaticWidget(kind: "Motivation")
    GainModeStaticWidget(kind: "NextGoal")
    GainModeStaticWidget(kind: "Performance")
    GainModeStaticWidget(kind: "GoodNight")
  }
}
