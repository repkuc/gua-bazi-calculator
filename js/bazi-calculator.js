async function handleBaziCalculate(event) {
  event.preventDefault();

  const birthDateInput = document.getElementById("baziBirthDate").value;
  const birthTimeInput = document.getElementById("baziBirthTime").value;
  const gender = document.getElementById("baziGender").value;
  const resultElement = document.getElementById("baziResult");
  const country = document.getElementById("baziCountry").value;
  const city = document.getElementById("baziCity").value;
  const timezone = document.getElementById("baziTimezone").value;

  const longitude = 24.1; // ← пока вручную для Риги
  const chinaTime = convertToChinaTime(
    birthDateInput,
    birthTimeInput,
    timezone,
    longitude
  );

  const chinaDateObj = chinaTime.toJSDate();
  let chinaYear = chinaDateObj.getFullYear();
  let chinaMonth = chinaDateObj.getMonth() + 1;
  let chinaDay = chinaDateObj.getDate();
  let chinaHour = chinaDateObj.getHours();

  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log("Часовой пояс систему: ", browserTimeZone);
  // 2. Логика Ба Цзы: если время >= 23:00,
  //    то это уже следующий день.
  if (chinaHour >= 23) {
    chinaDay++;
    chinaHour = 0; // некоторые ставят 1, но чаще 0 — суть, что это начало "новых суток"

    // Проверяем, не вылезли ли за границы месяца:
    const daysInMonth = new Date(chinaYear, chinaMonth, 0).getDate();
    if (chinaDay > daysInMonth) {
      chinaDay = 1;
      chinaMonth++;
      if (chinaMonth > 12) {
        chinaMonth = 1;
        chinaYear++;
      }
    }
  }

  // 3. Теперь в переменных лежит "Ба Цзы дата"
  //    (с учётом UTC+8 и сдвига суток на 23:00)

  // Если пользователь не указал время, hour = null
  const parsed = parseBaziDate(birthDateInput, birthTimeInput);
  const finalHour = parsed.hasHour ? chinaHour : null;

  if (!birthDateInput) {
    resultElement.textContent = "Пожалуйста, выберите дату рождения.";
    resultElement.style.display = "block";
    resultElement.style.opacity = "1";
    return;
  }

  console.log("Date: ", birthDateInput);
  console.log("Time: ", birthTimeInput || "time not set");
  console.log("Sex: ", gender);
  console.log("Страна:", country);
  console.log("Город:", city);
  console.log("Часовой пояс:", timezone);

  console.log("💡 Час для расчёта (chinaHour):", chinaHour);
  const bazi = getBaziPillars({
    hour: finalHour,
    year: chinaYear,
    month: chinaMonth,
    day: chinaDay,
  });

  console.log("Ба Цзы карта: ", bazi);
  displayBaziResult(bazi);
}

const heavenlyStems = [
  "甲 — Дерево Ян",
  "乙 — Дерево Инь",
  "丙 — Огонь Ян",
  "丁 — Огонь Инь",
  "戊 — Земля Ян",
  "己 — Земля Инь",
  "庚 — Металл Ян",
  "辛 — Металл Инь",
  "壬 — Вода Ян",
  "癸 — Вода Инь",
];

const earthlyBranches = [
  "子 — Крыса (Вода)",
  "丑 — Бык (Земля)",
  "寅 — Тигр (Дерево)",
  "卯 — Кролик (Дерево)",
  "辰 — Дракон (Земля)",
  "巳 — Змея (Огонь)",
  "午 — Лошадь (Огонь)",
  "未 — Коза (Земля)",
  "申 — Обезьяна (Металл)",
  "酉 — Петух (Металл)",
  "戌 — Собака (Земля)",
  "亥 — Кабан (Вода)",
];

// Таблица: ствол года (0–9) × месяц (0–11) → ствол месяца
const monthStemTable = [
  [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3], // 甲 — Дерево Ян
  [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5], // 乙 — Дерево Инь
  [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7], // 丙 — Огонь Ян
  [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // 丁 — Огонь Инь
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1], // 戊 — Земля Ян
  [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3], // 己 — Земля Инь
  [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5], // 庚 — Металл Ян
  [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7], // 辛 — Металл Инь
  [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // 壬 — Вода Ян
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1], // 癸 — Вода Инь
];

// Таблица: ствол дня (0–9) × ветвь часа (0–11) → ствол часа (индекс 0–9)
const hourStemTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1], // 甲
  [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3], // 乙
  [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5], // 丙
  [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7], // 丁
  [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // 戊
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1], // 己
  [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3], // 庚
  [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5], // 辛
  [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7], // 壬
  [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // 癸
];

function getYearPillar(year) {
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;

  const stem = heavenlyStems[stemIndex];
  const branch = earthlyBranches[branchIndex];

  //console.log("Столп года: ", stem + branch);

  return {
    stemIndex,
    branchIndex,
    stem,
    branch,
    pillar: stem + branch,
  };
}

function getMonthPillar(year, month, day) {
  console.log("🌞 solar2lunar input:", { year, month, day });

  const lunar = solarlunar.solar2lunar(year, month, day);
  console.log("🌕 lunar response:", lunar);

  if (!lunar || !lunar.gzMonth) {
    console.warn("❌ Ошибка: solar2lunar не вернул gzMonth");
    return {
      stem: "?",
      branch: "?",
      stemIndex: null,
      branchIndex: null,
      pillar: "?",
    };
  }

  const stem = lunar.gzMonth[0]; // 1-й символ
  const branch = lunar.gzMonth[1]; // 2-й символ

  return {
    stem,
    branch,
    stemIndex: heavenlyStems.findIndex((s) => s.startsWith(stem)),
    branchIndex: earthlyBranches.findIndex((b) => b.startsWith(branch)),
    pillar: stem + branch,
  };
}

function getDayPillar(year, month, day) {
  const lunar = solarlunar.solar2lunar(year, month, day);

  if (!lunar || !lunar.gzDay) {
    console.warn("❌ Ошибка: solar2lunar не вернул gzDay");

    return {
      stem: "?",
      branch: "?",
      stemIndex: null,
      branchIndex: null,
      pillar: "не рассчитан",
    };
  }

  const stem = lunar.gzDay[0];
  const branch = lunar.gzDay[1];

  return {
    stem,
    branch,
    stemIndex: heavenlyStems.findIndex((s) => s.startsWith(stem)),
    branchIndex: earthlyBranches.findIndex((b) => b.startsWith(branch)),
    pillar: stem + branch,
  };
}

function getHourPillar(hour, dayStemIndex) {
  if (
    hour === null ||
    dayStemIndex === null ||
    dayStemIndex < 0 ||
    dayStemIndex > 9
  ) {
    return null; // если время не указано
  }
  // Добавляем 2 часа для коррекции
  // hour = (hour + 2) % 24;

  // Определяем индекс земной ветви по часу
  let branchIndex;
  if (hour >= 23 || hour < 1) {
    branchIndex = 0; // Крыса (子)
  } else if (hour < 3) {
    branchIndex = 1; // Бык (丑)
  } else if (hour < 5) {
    branchIndex = 2; // Тигр (寅)
  } else if (hour < 7) {
    branchIndex = 3; // Кролик (卯)
  } else if (hour < 9) {
    branchIndex = 4; // Дракон (辰)
  } else if (hour < 11) {
    branchIndex = 5; // Змея (巳)
  } else if (hour < 13) {
    branchIndex = 6; // Лошадь (午)
  } else if (hour < 15) {
    branchIndex = 7; // Коза (未)
  } else if (hour < 17) {
    branchIndex = 8; // Обезьяна (申)
  } else if (hour < 19) {
    branchIndex = 9; // Петух (酉)
  } else if (hour < 21) {
    branchIndex = 10; // Собака (戌)
  } else {
    branchIndex = 11; // Кабан (亥)
  }

  const branch = earthlyBranches[branchIndex];
  console.log("Выбрана земная ветвь с индексом:", branchIndex, "->", branch);

  // Добавляем защиту
  const row = hourStemTable[dayStemIndex];
  if (!row || typeof row[branchIndex] === "undefined") {
    return null;
  }

  // Определяем индекс небесного ствола по таблице
  const stemIndex = hourStemTable[dayStemIndex][branchIndex];
  const stem = heavenlyStems[stemIndex];
  console.log("Выбран небесный ствол с индексом:", stemIndex, "->", stem);
  // const branch = earthlyBranches[branchIndex];
  // const stemIndex = row[branchIndex];
  // const stem = heavenlyStems[stemIndex];

  console.log("➡️ getHourPillar: hour =", hour);

  return {
    stem,
    stemIndex,
    branch,
    branchIndex,
    pillar: stem + branch,
  };
}

function getBaziPillars(parsed) {
  const dateObj = new Date(parsed.year, parsed.month - 1, parsed.day);

  const yearPillar = getYearPillar(parsed.year);
  const monthPillar = getMonthPillar(parsed.year, parsed.month, parsed.day);
  const dayPillar = getDayPillar(parsed.year, parsed.month, parsed.day);
  const hourPillar = getHourPillar(parsed.hour, dayPillar.stemIndex);

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };
}

function parseBaziDate(birthDateStr, birthTimeStr) {
  // Если время указано — объединяем дату и время
  const fullDateStr = birthTimeStr
    ? `${birthDateStr}T${birthTimeStr}`
    : `${birthDateStr}T12:00`; //время ← используется только для объекта Date, чтобы не упал

  const dateObj = new Date(fullDateStr); // создаём объект даты

  const year = dateObj.getFullYear(); // получаем год
  const month = dateObj.getMonth() + 1; // месяц от 0 до 11, поэтому +1
  const day = dateObj.getDate(); // число месяца
  // Часы: если пользователь ввёл время — берём часы из даты, иначе null
  const hours = birthTimeStr ? dateObj.getHours() : null; // часы (0–23)

  // Для отладки — покажем результат в консоли
  console.log("🧭 Год:", year);
  console.log("📅 Месяц:", month);
  console.log("📆 День:", day);
  console.log("⏰ Часы:", hours);

  // Вернём как объект
  return {
    year,
    month,
    day,
    hour: hours, // либо число, либо null
    hasHour: !!birthTimeStr, // булево: true если введено, false если нет
  };
}

function getChinaHourManually(birthDateStr, birthTimeStr) {
  if (!birthTimeStr) return null;

  const [hh, mm] = birthTimeStr.split(":").map(Number);

  let chinaHour = hh + 8;
  if (chinaHour >= 24) chinaHour -= 24;

  return chinaHour;
}

function convertToChinaTime(birthDateStr, birthTimeStr, timezone, longitude) {
  const DateTime = luxon.DateTime;

  const timePart = birthTimeStr || "12:00";
  const isoInput = `${birthDateStr}T${timePart}`;

  // 1. Локальное время в заданной зоне
  const localTime = DateTime.fromISO(isoInput, { zone: timezone });
  console.log("Локальное время:", localTime.toString());
  // 2. Переводим в UTC
  const utc = localTime.toUTC();
  console.log("UTC:", utc.toString());

  // 3. Китайское время (UTC+8)
  const chinaTime = utc.setZone("Asia/Shanghai");
  console.log("Китайское время:", chinaTime.toString());
  const correctedTime = chinaTime.minus({ hours: 2 }); // чтобы результат совпадал со всеми калькуляторами. иначи результат в разницу 2 часа

  console.log("📆 UTC:", utc.toFormat("yyyy-MM-dd HH:mm"));
  console.log(
    "🇨🇳 ChinaTime (ручной UTC+8):",
    chinaTime.toFormat("yyyy-MM-dd HH:mm")
  );

  return correctedTime;
}

function displayBaziResult(bazi) {
  const resultElement = document.getElementById("baziResult");

  let resultHtml = "<h3>Ваша карта Ба Цзы: </h3>";
  resultHtml += `<p><strong>Год: </strong> ${bazi.year.pillar}</p>`;
  resultHtml += `<p><strong>Месяц: </strong> ${bazi.month.pillar}</p>`;
  resultHtml += `<p><strong>День: </strong> ${bazi.day.pillar}</p>`;
  resultHtml +=
    bazi.hour && bazi.hour.pillar
      ? `<p><strong>Час: </strong> ${bazi.hour.pillar}</p>`
      : `<p><em>Часовой столп не рассчитан (время не указано)</em></p>`;

  resultElement.innerHTML = resultHtml;
  resultElement.style.display = "block";
  setTimeout(() => {
    resultElement.style.opacity = "1";
  }, 10);
}

document
  .getElementById("baziForm")
  .addEventListener("submit", handleBaziCalculate);
