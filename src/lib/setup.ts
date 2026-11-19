// The details a company types in to say who the agent should call. The engine checks them again; this is so the page can say what is wrong at once.
export type Form = {
  company: string;
  fullName: string;
  phone: string;
  birthDay: string;
  birthMonth: string;
  amount: string;
  dueDate: string;
};

export const EMPTY: Form = { company: "", fullName: "", phone: "", birthDay: "", birthMonth: "", amount: "", dueDate: "" };

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const PRESETS: { name: string; company: string; badge: string; form: Form }[] = [
  {
    name: "Ada Obi",
    company: "Acme Microfinance",
    badge: "₦25,000 · 3 Days",
    form: {
      company: "Acme Microfinance",
      fullName: "Ada Obi",
      phone: "+234 803 000 0000",
      birthDay: "14",
      birthMonth: "3",
      amount: "25000",
      dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
    },
  },
  {
    name: "Chidi Okafor",
    company: "FairMoney",
    badge: "₦85,000 · 7 Days",
    form: {
      company: "FairMoney",
      fullName: "Chidi Okafor",
      phone: "+234 802 111 2233",
      birthDay: "22",
      birthMonth: "7",
      amount: "85000",
      dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
    },
  },
  {
    name: "Amina Bello",
    company: "Carbon",
    badge: "₦42,000 · Tomorrow",
    form: {
      company: "Carbon",
      fullName: "Amina Bello",
      phone: "+234 814 555 6677",
      birthDay: "9",
      birthMonth: "11",
      amount: "42000",
      dueDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
    },
  },
];

// A made-up example to try the agent with.
export function example(today = new Date()): Form {
  const due = new Date(today.getTime() + 3 * 86_400_000);
  return {
    company: "Acme Microfinance",
    fullName: "Ada Obi",
    phone: "+234 803 000 0000",
    birthDay: "14",
    birthMonth: "3",
    amount: "25000",
    dueDate: due.toISOString().slice(0, 10),
  };
}

const PHONE = /^\+?[0-9][0-9 ()-]{6,17}$/;

export function daysIn(month: number): number {
  return new Date(2024, month, 0).getDate(); // 2024 has a 29 February
}

export type Problems = Partial<Record<keyof Form, string>>;

export function validate(f: Form): Problems {
  const p: Problems = {};
  const tidy = (s: string) => s.trim().replace(/\s+/g, " ");
  if (tidy(f.company).length < 2) p.company = "Enter the company's name.";
  if (tidy(f.fullName).length < 2) p.fullName = "Enter the person's full name.";
  if (!PHONE.test(f.phone.trim())) p.phone = "Enter a phone number, like +234 803 000 0000.";
  const month = Number(f.birthMonth);
  const day = Number(f.birthDay);
  if (!month) p.birthMonth = "Pick a month.";
  if (!day) p.birthDay = "Pick a day.";
  else if (month && day > daysIn(month)) p.birthDay = `${MONTHS[month - 1]} has only ${daysIn(month)} days.`;
  const amount = Number(f.amount);
  if (!f.amount || !Number.isFinite(amount) || amount <= 0) p.amount = "Enter the amount owed, more than zero.";
  else if (amount > 100_000_000) p.amount = "That is more than ₦100,000,000.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dueDate)) p.dueDate = "Pick the due date.";
  return p;
}

// What the engine wants.
export function toPayload(f: Form) {
  const tidy = (s: string) => s.trim().replace(/\s+/g, " ");
  return {
    company: tidy(f.company),
    full_name: tidy(f.fullName),
    phone: f.phone.trim(),
    birth_day: Number(f.birthDay),
    birth_month: Number(f.birthMonth),
    amount_due_ngn: Number(f.amount),
    due_date: f.dueDate,
  };
}

// What Idara will say first, so the company can see how its details are used.
export function greeting(f: Form): string {
  const company = f.company.trim() || "your company";
  const name = f.fullName.trim() || "the borrower";
  return `Hello, this is Idara, an automated assistant from ${company}. Am I speaking with ${name}?`;
}

// The columns a spreadsheet will need, once upload works.
export const COLUMNS = [
  { name: "company", required: true, format: "Text", example: "Acme Microfinance" },
  { name: "full_name", required: true, format: "Text", example: "Ada Obi" },
  { name: "phone", required: true, format: "International format", example: "+2348030000000" },
  { name: "birth_day", required: true, format: "1 to 31", example: "14" },
  { name: "birth_month", required: true, format: "1 to 12", example: "3" },
  { name: "amount_due_ngn", required: true, format: "Number, no commas", example: "25000" },
  { name: "due_date", required: true, format: "YYYY-MM-DD", example: "2026-12-01" },
];
