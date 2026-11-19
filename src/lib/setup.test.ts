import { EMPTY, example, greeting, toPayload, validate } from "@/lib/setup";

describe("the company's details", () => {
  it("accepts the example", () => {
    expect(validate(example(new Date("2026-11-18T10:00:00Z")))).toEqual({});
  });

  it("says what is missing, field by field", () => {
    const p = validate(EMPTY);
    expect(Object.keys(p).sort()).toEqual(["amount", "birthDay", "birthMonth", "company", "dueDate", "fullName", "phone"]);
  });

  it("refuses a day that is not in that month", () => {
    const f = { ...example(), birthDay: "31", birthMonth: "2" };
    expect(validate(f).birthDay).toBe("February has only 29 days.");
    expect(validate({ ...f, birthDay: "29" })).toEqual({});
  });

  it("refuses a bad phone number and a bad amount", () => {
    expect(validate({ ...example(), phone: "hello" }).phone).toBeDefined();
    expect(validate({ ...example(), amount: "0" }).amount).toBeDefined();
    expect(validate({ ...example(), amount: "-5" }).amount).toBeDefined();
    expect(validate({ ...example(), amount: "1e12" }).amount).toBeDefined();
  });

  it("tidies spaces and gives the engine numbers", () => {
    const body = toPayload({ ...example(), company: "  Acme   Micro ", amount: "1500.5", birthDay: "04" });
    expect(body).toMatchObject({ company: "Acme Micro", amount_due_ngn: 1500.5, birth_day: 4, birth_month: 3 });
  });

  it("shows what the agent will say", () => {
    expect(greeting({ ...EMPTY, company: "Acme", fullName: "Ada Obi" })).toBe(
      "Hello, this is Idara, an automated assistant from Acme. Am I speaking with Ada Obi?",
    );
    expect(greeting(EMPTY)).toContain("your company");
  });
});
