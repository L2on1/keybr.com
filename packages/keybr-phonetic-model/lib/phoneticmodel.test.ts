import { toCodePoints } from "@keybr/unicode";
import test from "ava";
import { Filter } from "./filter.ts";
import { TransitionTableBuilder } from "./generate/builder.ts";
import { Letter } from "./letter.ts";
import { newPhoneticModel } from "./phoneticmodel.ts";

test("generate text from an empty transition table", (t) => {
  const alphabet = [0x0020, 0x0061, 0x0062, 0x0063, 0x0064];

  const builder = new TransitionTableBuilder(4, alphabet);

  const model = newPhoneticModel(builder.build());
  const { letters } = model;
  const [a, b, c, d] = letters;

  t.deepEqual(letters, [
    new Letter(0x0061, 0.0),
    new Letter(0x0062, 0.0),
    new Letter(0x0063, 0.0),
    new Letter(0x0064, 0.0),
  ]);

  t.is(model.nextWord(new Filter(null, null)), "");
  t.is(model.nextWord(new Filter([a], null)), "");
  t.is(model.nextWord(new Filter([a], a)), "a");
  t.is(model.nextWord(new Filter([a, b, c, d], a)), "a");
});

test("generate text from a partial transition table", (t) => {
  const alphabet = [0x0020, 0x0061, 0x0062, 0x0063, 0x0064];

  const builder = new TransitionTableBuilder(4, alphabet);

  builder.set([0x0020, 0x0020, 0x0020, 0x0020], 1);
  builder.set([0x0020, 0x0020, 0x0020, 0x0061], 1);
  builder.set([0x0020, 0x0020, 0x0020, 0x0062], 1);
  builder.set([0x0020, 0x0020, 0x0020, 0x0063], 1);
  builder.set([0x0020, 0x0020, 0x0020, 0x0064], 1);

  const model = newPhoneticModel(builder.build());
  const { letters } = model;
  const [a, b, c, d] = letters;

  t.deepEqual(letters, [
    new Letter(0x0061, 0.25),
    new Letter(0x0062, 0.25),
    new Letter(0x0063, 0.25),
    new Letter(0x0064, 0.25),
  ]);

  t.regex(model.nextWord(new Filter(null, null)), /^[abcd]$/);
  t.regex(model.nextWord(new Filter([a], null)), /^[a]$/);
  t.regex(model.nextWord(new Filter([a], a)), /^[a]$/);
  t.regex(model.nextWord(new Filter([a, b, c, d], a)), /^[a]$/);
});

test("generate text from a full transition table", (t) => {
  const alphabet = [0x0020, 0x0061, 0x0062, 0x0063, 0x0064];

  const builder = new TransitionTableBuilder(4, alphabet);

  for (const l1 of alphabet) {
    for (const l2 of alphabet) {
      for (const l3 of alphabet) {
        for (const l4 of alphabet) {
          builder.set([l1, l2, l3, l4], 1);
        }
      }
    }
  }

  const model = newPhoneticModel(builder.build());
  const { letters } = model;
  const [a, b, c, d] = letters;

  t.deepEqual(letters, [
    new Letter(0x0061, 0.25),
    new Letter(0x0062, 0.25),
    new Letter(0x0063, 0.25),
    new Letter(0x0064, 0.25),
  ]);

  t.regex(model.nextWord(new Filter(null, null)), /^[abcd]{1,}$/);
  t.regex(model.nextWord(new Filter([a], null)), /^[a]{1,}$/);
  t.regex(model.nextWord(new Filter([a], a)), /^[a]{1,}$/);
  t.regex(model.nextWord(new Filter([a, b, c, d], a)), /^[abcd]{1,}$/);
});

test("appended words", (t) => {
  const alphabet = [...toCodePoints(" abcdefghijklmnopqrstuvw")];

  const builder = new TransitionTableBuilder(4, alphabet);

  builder.append("hello");

  const model = newPhoneticModel(builder.build());

  t.is(model.nextWord(new Filter(null, null)), "hello");
  t.is(model.nextWord(new Filter(null, null)), "hello");
  t.is(model.nextWord(new Filter(null, null)), "hello");
});
