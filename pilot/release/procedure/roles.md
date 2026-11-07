## pro_draft
# Write the PRO argument

**Your side:** argue that this value gives a person a reason to {favor_word} {bill}. Give every separate reason the evidence supports, not just the strongest one or two. Small and secondary effects count when the evidence supports them. State any limit that the evidence shows.

{common}

**Skeleton:**

```
**Claim:** [one sentence: this value gives Morgan a reason to {favor_word} {bill}]

**Reasons**

1. [Reason, in one sentence]
   - **Because:** [what the bill changes, compared with the law in force] “quotation” [doc_id]
   - **Because:** [premise] “quotation” [doc_id]
   - **So:** [how this bears on the value, with any limit the evidence shows]
2. [Next reason, in the same form]

**Conclusion:** [one sentence]
```

**Output:** write the argument to `output/argument.md`, following the skeleton. It should contain the argument only.

## pro_review
# Check the PRO draft

**Your side:** the argument that this value gives a person a reason to {favor_word} {bill}. A separate session drafted it; it is in `draft/argument.md`, with its new sources in `draft/sources/` and its searches in `draft/search_log.tsv`. This is a check of the draft. A separate full quality and clarity pass comes later.

Your job as reviewer:
- Check every citation in context: open the cited passage and confirm it supports the claim it is attached to. Fix or cut any claim its source does not support.
- Check the reasoning with the logic-review method in `skill/SKILL.md`: read it first, with the references it points to, and apply it to this argument. Make sure that:
  - each **So** follows from the **Because** lines it rests on, and the **Conclusion** follows from the points;
  - the step from what the bill does to the value is argued, not assumed;
  - the argument stays inside the value boundary given in the rules;
  - terms keep one meaning throughout, including the value's terms and what the bill does;
  - numbers and comparisons are like for like;
  - no premise claims more than its quotation says.
- Repair each reasoning gap: add the missing premise with evidence, correct the misreading, trim the claim to what its evidence supports, or cut a point that cannot be repaired. Leave sound steps alone.
- Do not leave a known defect in the text with only a note about it. If the evidence leaves a real uncertainty, state it in the point and do not claim more than the evidence shows.
- State a real limit or uncertainty when the evidence shows one. Do not remove an accurate limit to make the argument sound stronger.
- Make sure the argument gives every separate reason the evidence supports, not just the strongest one or two. Add any reason the draft left out, including a supported small or secondary effect.
- Check that each numbered reason is a separate path from the bill to the value. Fold a reason that only extends another reason's path, such as a later consequence of the same effect, into that reason as Because and So lines.
- Add any stronger point or evidence the draft missed, searching if needed.
- Keep the skeleton below, and make the structure easy to follow.
- Cut superfluous words, without removing substance.
- Simplify the diction: replace technical or formal words with everyday ones, and split long sentences.

{common}

**Skeleton:**

```
**Claim:** [one sentence: this value gives Morgan a reason to {favor_word} {bill}]

**Reasons**

1. [Reason, in one sentence]
   - **Because:** [what the bill changes, compared with the law in force] “quotation” [doc_id]
   - **Because:** [premise] “quotation” [doc_id]
   - **So:** [how this bears on the value, with any limit the evidence shows]
2. [Next reason, in the same form]

**Conclusion:** [one sentence]
```

**Output:**
- `output/argument.md`: the complete revised argument, following the skeleton.
- `output/review_notes.md`: a short list of what you changed and why, and any problem you found but could not resolve. Every listed problem goes into the later finding inventory.
- `output/sources/`: only the new sources you find yourself, numbered after the draft's highest new_NN. Do not copy files from `draft/sources/`; the harness copies the ones you cite.
- `output/search_log.tsv`: your own searches, if any.

## con_draft
# Write the CON argument

**Your side:** test the PRO argument in `pro/argument.md`, which argues that this value gives a person a reason to {favor_word} {bill}. For each PRO point, decide whether it has a genuine defect. A genuine defect is a problem in the point as the PRO wrote it: a necessary step the evidence does not support, relevant contrary evidence, a limit in the bill's legal scope, a relevant null result, a documented change in practice or a demonstrated constraint. The PRO's new sources are in `pro/sources/` as `pro_new_NN.txt`; cite them as [pro_new_NN].

These do not count as a defect by themselves: a small effect, an uncertain size, an existing activity, the lack of a set-aside amount of money or the lack of an estimate for this bill. Do not answer a stronger claim than the PRO makes. Do not demand certainty.

{common}

**Skeleton:** each response will be shown right next to the PRO point it answers, so do not restate the PRO's points. Cover every PRO point, in order, using the PRO's numbers. When a point has a genuine defect, write a **Response**. When it has none, write exactly `N. No defensible CON retained.`, with the PRO's number as N and no reason after it. Add a **New point** only if the PRO leaves out something that undercuts its reason, and name the numbered PRO points it applies to.

```
**Claim:** [one sentence: what the responses below show about the PRO's case; if no point has a genuine defect, say that no defensible objection is retained]

**Responses**

1. **Response:** [the defect in PRO point 1, naming the step it challenges, in one sentence]
   - **Because:** [premise] “quotation” [doc_id]
   - **So:** [what follows for that step, and which part of the PRO's case it leaves unanswered]
2. No defensible CON retained.

**New point:** [only if needed, in the same form, naming the PRO points it applies to]

**Conclusion:** [one sentence]
```

**Output:** write the response to `output/argument.md`, following the skeleton. It should contain the argument only.

## con_review
# Check the CON draft

**Your side:** the response in `draft/argument.md` to the PRO argument in `pro/argument.md`, which argues that this value gives a person a reason to {favor_word} {bill}. A separate session drafted the response. Its new sources are in `draft/sources/`, and the PRO's are in `pro/sources/`. This is a check of the draft. A separate full quality and clarity pass comes later.

Your job as reviewer:
- Check every citation in context: open the cited passage and confirm it supports the claim it is attached to. Fix or cut any claim its source does not support.
- Check the reasoning with the logic-review method in `skill/SKILL.md`: read it first, with the references it points to, and apply it to this response. Make sure that:
  - every PRO point has either a **Response** or the exact marker `N. No defensible CON retained.` under the PRO's number;
  - each **Response** identifies a genuine defect in the PRO point as the PRO wrote it, not in a stronger or different claim;
  - each **Response** would undercut that point if true, and says which part of the PRO's case it leaves unanswered;
  - each **So** follows from the **Because** lines it rests on, and no conclusion denies what its own premises grant;
  - the **Claim** and **Conclusion** follow from what the responses actually show;
  - terms keep one meaning throughout, including the value's terms and what the bill does;
  - numbers and comparisons are like for like;
  - no premise claims more than its quotation says.
- Repair each reasoning gap: add the missing premise with evidence, correct the misreading or trim the claim to what its evidence supports. Leave sound steps alone.
- Do not leave a known defect in the text with only a note about it. If the evidence leaves a real uncertainty, state it in the response and do not claim more than the evidence shows.
- Replace a response with the exact marker when it cannot be repaired into a genuine defect. Do not invent a different objection for balance.
- State a real limit or uncertainty when the evidence shows one.
- Add any stronger point or evidence the draft missed, searching if needed.
- Keep the skeleton below, and make the structure easy to follow.
- Cut superfluous words, without removing substance.
- Simplify the diction: replace technical or formal words with everyday ones, and split long sentences.

{common}

**Skeleton:** each response will be shown right next to the PRO point it answers, so do not restate the PRO's points. Cover every PRO point, in order, using the PRO's numbers. When a point has a genuine defect, write a **Response**. When it has none, write exactly `N. No defensible CON retained.`, with the PRO's number as N and no reason after it. Add a **New point** only if the PRO leaves out something that undercuts its reason, and name the numbered PRO points it applies to.

```
**Claim:** [one sentence: what the responses below show about the PRO's case; if no point has a genuine defect, say that no defensible objection is retained]

**Responses**

1. **Response:** [the defect in PRO point 1, naming the step it challenges, in one sentence]
   - **Because:** [premise] “quotation” [doc_id]
   - **So:** [what follows for that step, and which part of the PRO's case it leaves unanswered]
2. No defensible CON retained.

**New point:** [only if needed, in the same form, naming the PRO points it applies to]

**Conclusion:** [one sentence]
```

**Output:**
- `output/argument.md`: the complete revised response, following the skeleton.
- `output/review_notes.md`: a short list of what you changed and why, and any problem you found but could not resolve. Every listed problem goes into the later finding inventory.
- `output/sources/`: only the new sources you find yourself, numbered after the draft's highest new_NN. Do not copy files from `draft/sources/` or `pro/sources/`; the harness copies the ones you cite.
- `output/search_log.tsv`: your own searches, if any.
