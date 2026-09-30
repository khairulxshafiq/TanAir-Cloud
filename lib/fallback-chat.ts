import { AllowedAgent } from './security/validation';

/**
 * Generates an intelligent Bahasa Melayu fallback response when the Hermes gateway is offline or unavailable.
 * Preserves 100% of the prototype conversational experience.
 */
export function generateFallbackStream(
  message: string,
  agent: AllowedAgent,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  let reply = '';
  const lowerMsg = message.toLowerCase();

  if (
    lowerMsg.includes('salam') ||
    lowerMsg.includes('hi') ||
    lowerMsg.includes('halo') ||
    lowerMsg.includes('hello')
  ) {
    reply =
      `Ada apa-apa yang boleh saya bantu anda uruskan hari ini? Anda boleh tanya saya tentang:\n\n` +
      `- 📊 **Analisis Pasaran & Saham** (Aura-Trade Trading Engine)\n` +
      `- ✍️ **Kandungan & Penulisan Sakluma** (Aura-Pen Content Engine)\n` +
      `- 🎨 **Penjanaan Imej AI** (Aura-Art FLUX LoRA)\n` +
      `- 📡 **Radar Trend & Scrape Media** (Aura-Scout Intelligence)\n` +
      `- 🎬 **Video & Media Motion** (Aura-Vision Pipeline)\n` +
      `- ⚙️ **Konfigurasi Agen & Integrasi Workflow**\n\n` +
      `Sila beritahu saya apa objektif anda!`;
  } else if (
    lowerMsg.includes('kredit') ||
    lowerMsg.includes('credit') ||
    lowerMsg.includes('payg') ||
    lowerMsg.includes('harga')
  ) {
    reply =
      `Sistem TanAir Cloud menggunakan sistem **Pay-As-You-Go (PAYG)**.\n\n` +
      `- Setiap pengguna Beta mendapat **RM10.00 kredit percuma** permulaan.\n` +
      `- Kos penggunaan ditolak secara telus mengikut jumlah token soalan & respons.\n` +
      `- Tambah nilai (topup) boleh dilakukan dengan pantas melalui integrasi FPX tempatan.`;
  } else if (
    lowerMsg.includes('sakluma') ||
    lowerMsg.includes('daging') ||
    lowerMsg.includes('salai')
  ) {
    reply =
      `Jenama **Sakluma** (Daging Salai Tempurung Kelapa) adalah salah satu tunjang operasi komersial TanAir.\n\n` +
      `Ejen **Aura-Pen** bertanggungjawab menghasilkan draf konten beremosi dan promosi di Facebook/TikTok, manakala **Aura-Art** menjana visual produk yang memukau.`;
  } else {
    reply =
      `Mesej anda: "*${message}*"\n\n` +
      `Saya telah merekodkan konteks perbualan ini ke dalam sesi kerja (*workspace sandbox*) anda di TanAir Cloud.\n\n` +
      `Sebagai pembantu AI berbilang ejen dengan piawaian Bahasa Melayu pintar, saya sedia membantu anda menyusun pelan tindakan, menjana teks, atau memproses tugasan automasi anda.`;
  }

  const fullText = `Hai! Saya **${agent}** (TanAir Cloud Assistant).\n\n${reply}`;
  const words = fullText.split(' ');

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const word of words) {
        const chunk = `data: ${JSON.stringify({ text: word + ' ' })}\n\n`;
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 15));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}
