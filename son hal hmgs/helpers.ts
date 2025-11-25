import { Question, RawGeminiQuestion } from "./types";

// Helper to transform raw JSON from user prompt into App's Question format
export const transformRaw = (raw: RawGeminiQuestion[], idPrefix: string): Question[] => {
  return raw.map((item, index) => {
    const options = Object.values(item.siklar);
    // Find index of the answer letter (A=0, B=1...)
    const answerIndex = item.cevap.toUpperCase().charCodeAt(0) - 65;
    const correctAnswerText = options[answerIndex] || "";

    // Normalize Category: "ANAYASA HUKUKU (1961 Yenilikleri)" -> "Anayasa Hukuku"
    let category = item.alan.split('(')[0].trim();
    
    // Title Case normalization if ALL CAPS (e.g. "ANAYASA HUKUKU" -> "Anayasa Hukuku")
    if (category === category.toUpperCase()) {
        category = category.split(' ').map(w => w.charAt(0) + w.slice(1).toLocaleLowerCase('tr-TR')).join(' ');
    }
    
    // Manual Mapping for cleaner charts
    const catUpper = category.toUpperCase();
    if (catUpper.includes("VERGİ USUL") || catUpper.includes("VUK")) category = "Vergi Usul Hukuku";
    else if (catUpper.includes("VERGİ")) category = "Vergi Hukuku";
    else if (catUpper.includes("ANAYASA")) category = "Anayasa Hukuku";
    else if (catUpper.includes("İDARE") && !catUpper.includes("YARGILAMA")) category = "İdare Hukuku";
    else if (catUpper.includes("İDARİ YARGILAMA") || catUpper.includes("İYUK")) category = "İdari Yargılama Usulü";
    else if (catUpper.includes("MEDENİ")) category = "Medeni Hukuk";
    else if (catUpper.includes("BORÇLAR")) category = "Borçlar Hukuku";
    else if (catUpper.includes("TİCARET")) category = "Ticaret Hukuku";
    else if (catUpper.includes("CEZA") && !catUpper.includes("MUHAKEMESİ")) category = "Ceza Hukuku";
    else if (catUpper.includes("CEZA MUHAKEMESİ") || catUpper.includes("CMK")) category = "Ceza Muhakemesi Hukuku";
    else if (catUpper.includes("İŞ HUKUKU")) category = "İş Hukuku";
    else if (catUpper.includes("SOSYAL GÜVENLİK")) category = "Sosyal Güvenlik Hukuku";
    else if (catUpper.includes("SENDİKALAR")) category = "İş Hukuku (Sendikalar)";
    else if (catUpper.includes("İCRA")) category = "İcra ve İflas Hukuku";
    else if (catUpper.includes("HMK") || catUpper.includes("HUKUK MUHAKEMELERİ")) category = "Hukuk Muhakemeleri Hukuku";
    else if (catUpper.includes("TARİH") || catUpper.includes("OSMANLI") || catUpper.includes("İLK TÜRK")) category = "Hukuk Tarihi";
    else if (catUpper.includes("FELSEFE") || catUpper.includes("SOSYOLOJİ") || catUpper.includes("TEORİ")) category = "Hukuk Felsefesi ve Sosyolojisi";
    else if (catUpper.includes("ULUSLARARASI") || catUpper.includes("YABANCILAR")) category = "Uluslararası Hukuk";
    else if (catUpper.includes("AMME")) category = "Amme Alacakları";
    else if (catUpper.includes("AVUKATLIK")) category = "Avukatlık Hukuku";

    return {
      id: `${idPrefix}-${item.id}-${index}`,
      category: category,
      text: item.soru,
      options: options,
      correctAnswer: correctAnswerText,
      explanation: item.cozum || "Cevap anahtarına göre."
    };
  });
};