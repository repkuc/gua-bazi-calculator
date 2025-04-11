function handleBaziCalculate(event) {
  event.preventDefault();

  const birthDateInput = document.getElementById("baziBirthDate").value;
  const birthTimeInput = document.getElementById("baziBirthTime").value;
  const gender = document.getElementById("baziGender").value;
  const resultElement = document.getElementById("baziResult");

  if (!birthDateInput) {
    resultElement.textContent = "Пожалуйста, выберите дату рождения.";
    resultElement.style.display = "block";
    resultElement.style.opacity = "1";
    return;
  }

  console.log("Date: ", birthDateInput);
  console.log("Time: ", birthTimeInput || "time not set");
  console.log("Sex: ", gender);

  const parsed = parsiBaziDate(birthDateInput, birthTimeInput);

  const yearPillar = getYearPillar(parsed.year);
  console.log("Годовой столп: ", yearPillar.pillar);
}

const heavenlyStems = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
];

const earthlyBranches = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];

function getYearPillar(year) {
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;

  const stem = heavenlyStems[stemIndex];
  const branch = earthlyBranches[branchIndex];

  console.log("Столп года: ", stem + branch);

  return {
    stemIndex,
    branchIndex,
    stem,
    branch,
    pillar: stem + branch,
  };
}

function parsiBaziDate(birthDateStr, birthTimeStr) {
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

document
  .getElementById("baziForm")
  .addEventListener("submit", handleBaziCalculate);
