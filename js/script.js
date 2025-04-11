let currentLanguage = "ru";

const GUA_REPLACEMENTS = {
  male: 2,
  female: 8,
};

function reduceToSingleDigit(num) {
  while (num >= 10) {
    num = num
      .toString()
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return num;
}

function calculateGuaNumber(birthDate, gender) {
  let year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  if (month < 2 || (month === 2 && day < 4)) {
    year -= 1;
  }

  const lastTwoDigits = year % 100;
  const sum = reduceToSingleDigit(lastTwoDigits);

  let gua;

  if (gender === "male") {
    gua = year < 2000 ? 10 - sum : 9 - sum;
    if (gua === 5) gua = GUA_REPLACEMENTS.male;
  } else {
    gua = year < 2000 ? 5 + sum : 6 + sum;
    gua = reduceToSingleDigit(gua);
    if (gua === 5) gua = GUA_REPLACEMENTS.female;
  }

  return gua;
}

function getGuaDescription(gua, currentLanguage) {
  if (
    guaDescriptions[currentLanguage] &&
    guaDescriptions[currentLanguage][gua]
  ) {
    return guaDescriptions[currentLanguage][gua];
  } else {
    return "Описание недоступно";
  }
}

function displayResult(gua) {
  const resultElement = document.getElementById("result");
  const description = getGuaDescription(gua, currentLanguage);
  const resultLabel = translations[currentLanguage].resultLabel;

  resultElement.innerHTML = `
    <p> ${resultLabel} <strong>${gua}</strong> </p>
    <p class="gua-calculator__meaning">${description}</p>
    `;

  resultElement.style.display = "block";
  setTimeout(() => {
    resultElement.style.opacity = "1";
  }, 10);
}

function handleCalculateClick() {
  console.log("Кнопка нажата!");
  const birthInput = document.getElementById("birthDate").value;
  const gender = document.getElementById("gender").value;
  const resultElement = document.getElementById("result");

  if (!birthInput) {
    resultElement.textContent = "Пожалуйста, выберите дату рождения.";
    resultElement.style.display = "block";
    resultElement.style.opacity = "1";
    return;
  }

  const birthDate = new Date(birthInput);
  const gua = calculateGuaNumber(birthDate, gender);
  displayResult(gua);
}

function updateUIText() {
  document.getElementById("mainTitle").textContent =
    translations[currentLanguage].title;
  document.getElementById("birthLabel").textContent =
    translations[currentLanguage].birthDate;
  document.getElementById("genderLabel").textContent =
    translations[currentLanguage].gender;
  document.getElementById("optMale").textContent =
    translations[currentLanguage].male;
  document.getElementById("optFemale").textContent =
    translations[currentLanguage].female;
  document.getElementById("calculateBtn").textContent =
    translations[currentLanguage].calculate;

  document.getElementById("langLabel").textContent =
    currentLanguage === "ru" ? "Язык" : "Language";
}

document
  .getElementById("langSelect")
  .addEventListener("change", function (event) {
    currentLanguage = event.target.value;
    updateUIText();
  });

window.addEventListener("DOMContentLoaded", function () {
  updateUIText();
});

document.getElementById("guaForm").addEventListener("submit", function (e) {
  e.preventDefault();
  handleCalculateClick();
});
