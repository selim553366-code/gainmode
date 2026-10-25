import SwiftUI
import WidgetKit

// MARK: - Quotes

/// Reads the same quotes.json the app uses, so both platforms show the same quote on the same day.
enum QuoteBook {
  private static let quotes: [String: [String]] = {
    guard
      let url = Bundle.main.url(forResource: "quotes", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let decoded = try? JSONDecoder().decode([String: [String]].self, from: data)
    else { return [:] }
    return decoded
  }()

  static let supported = ["tr", "en", "de", "fr", "es"]

  static var language: String {
    for identifier in Locale.preferredLanguages {
      let code = String(identifier.prefix(2))
      if supported.contains(code) { return code }
    }
    return "en"
  }

  static func quote(for date: Date, language: String) -> String {
    let list = quotes[language] ?? quotes["en"] ?? ["Small steps, big transformations."]
    let day = Calendar.current.ordinality(of: .day, in: .year, for: date) ?? 1
    return list[day % list.count]
  }

  static func eyebrow(for language: String) -> String {
    switch language {
    case "tr": return "GÜNÜN SÖZÜ"
    case "de": return "IMPULS DES TAGES"
    case "fr": return "L’ÉLAN DU JOUR"
    case "es": return "IMPULSO DEL DÍA"
    default: return "TODAY’S FUEL"
    }
  }
}

// MARK: - Timeline

struct QuoteEntry: TimelineEntry {
  let date: Date
  let quote: String
  let eyebrow: String
}

struct QuoteProvider: TimelineProvider {
  private func entry(at date: Date) -> QuoteEntry {
    let language = QuoteBook.language
    return QuoteEntry(date: date, quote: QuoteBook.quote(for: date, language: language), eyebrow: QuoteBook.eyebrow(for: language))
  }

  func placeholder(in context: Context) -> QuoteEntry { entry(at: Date()) }

  func getSnapshot(in context: Context, completion: @escaping (QuoteEntry) -> Void) {
    completion(entry(at: Date()))
  }

  // One entry now and one at the next local midnight, when the quote changes.
  func getTimeline(in context: Context, completion: @escaping (Timeline<QuoteEntry>) -> Void) {
    let now = Date()
    let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
    completion(Timeline(entries: [entry(at: now), entry(at: midnight)], policy: .after(midnight)))
  }
}

// MARK: - Poster

private let brandTop = Color(red: 0.231, green: 0.482, blue: 0.949)    // #3B7BF2
private let brandBottom = Color(red: 0.106, green: 0.247, blue: 0.722) // #1B3FB8
private let brandSky = Color(red: 0.557, green: 0.859, blue: 0.980)    // #8EDBFA

struct MotivationPosterView: View {
  @Environment(\.widgetFamily) private var family
  let entry: QuoteEntry

  var body: some View {
    switch family {
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text(entry.eyebrow).font(.system(size: 10, weight: .bold)).widgetAccentable()
        Text(entry.quote).font(.system(size: 13, weight: .semibold)).lineLimit(3).minimumScaleFactor(0.8)
      }
    default:
      poster
    }
  }

  private var compact: Bool { family == .systemSmall }

  private var poster: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack {
        Text(entry.eyebrow)
          .font(.system(size: 10, weight: .bold))
          .tracking(1.2)
          .foregroundStyle(.white.opacity(0.72))
        Spacer()
        if !compact {
          Text("GAINMODE").font(.system(size: 10, weight: .heavy)).tracking(0.8).foregroundStyle(.white)
        }
      }
      Spacer(minLength: 8)
      Text(entry.quote)
        .font(.system(size: quoteSize, weight: .bold, design: .rounded))
        .foregroundStyle(.white)
        .lineLimit(compact ? 5 : 4)
        .minimumScaleFactor(0.7)
        .contentTransition(.opacity)
      Spacer(minLength: 8)
      HStack(spacing: 8) {
        Capsule().fill(brandSky).frame(width: 22, height: 3)
        Text(compact ? "GAINMODE" : "FitBud")
          .font(.system(size: 11, weight: .semibold))
          .foregroundStyle(.white.opacity(0.8))
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .containerBackground(for: .widget) {
      ZStack {
        LinearGradient(colors: [brandTop, brandBottom], startPoint: .topLeading, endPoint: .bottomTrailing)
        Circle()
          .fill(.white.opacity(0.08))
          .frame(width: 220, height: 220)
          .offset(x: 110, y: -90)
      }
    }
  }

  private var quoteSize: CGFloat {
    switch family {
    case .systemSmall: return 16
    case .systemLarge: return 30
    default: return 21
    }
  }
}

// MARK: - Widget

@main
struct GainModeWidgetBundle: WidgetBundle {
  var body: some Widget {
    MotivationWidget()
  }
}

struct MotivationWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "GainModeMotivation", provider: QuoteProvider()) { entry in
      MotivationPosterView(entry: entry)
    }
    .configurationDisplayName("GainMode")
    .description("Her gün yeni bir motivasyon sözü.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular])
  }
}
