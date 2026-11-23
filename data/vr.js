/* Verbal Reasoning course: the 21 standard GL question types, grouped as words, letters, codes, numbers and logic. */
window.BANK = window.BANK || {};
window.BANK.vr = {
  id: 'vr',
  name: 'Verbal Reasoning',
  topics: [
    { id: 'closest_meaning', name: 'Closest meaning', lesson: {
      text: 'You are given two groups of words. Choose one word from each group so that the two words mean the same, or nearly the same.\n\nTake the first word of the first group and compare it with every word in the second group. If nothing matches, move to the next word. Work in order so that you do not miss a pair.\n\nWhen you think you have a pair, test it. Put each word into the same short sentence. If the sentence still means the same, you have found the answer.',
      example: '(big, red, slow) (large, quiet, wet). Big and large mean the same: "a big dog" and "a large dog". The answer is big and large.',
      watch: 'Words that are only linked, such as hot and sun, are not synonyms. The two words must be able to replace each other.' } },
    { id: 'opposite_meaning', name: 'Opposite meaning', lesson: {
      text: 'This is like the closest meaning question, but now you need two words that are opposites: one from each group.\n\nWork through the first group one word at a time. For each word, ask yourself, "What is the opposite of this?" Then look for it in the second group.\n\nCheck that your two words are the same kind of word. The opposite of the verb "arrive" is the verb "leave", not the noun "exit".',
      example: '(hot, tall, early) (short, wet, night). The opposite of tall is short. The answer is tall and short.',
      watch: 'Read the instruction every time. It is easy to pick two words that mean the same when the question wants opposites.' } },
    { id: 'odd_two_out', name: 'Odd two out', lesson: {
      text: 'Five words are given. Three of them belong together in some way, and two do not. You must find the two that do not belong.\n\nStart by looking for the group of three. Ask what they share. They might be the same kind of thing, such as fruits, or they might mean the same, or be the same kind of word.\n\nThe two odd words do not need to match each other, although they often do. All that matters is that they do not fit the group of three.',
      example: 'apple, carrot, banana, bread, cherry. Apple, banana and cherry are fruits. The two that do not belong are carrot and bread.',
      watch: 'Make sure exactly three words share your link. If four words fit, your link is too wide, so look for a narrower one.' } },
    { id: 'word_connections', name: 'Word connections', lesson: {
      text: 'These questions say that one thing is to another as a third thing is to something else. Your job is to complete the second pair so that it matches the first.\n\nFirst say exactly how the first two words are connected, in a short sentence. For "puppy is to dog", you might say "a puppy is a young dog".\n\nThen use the very same sentence for the second pair: "a kitten is a young ...". The answer is cat.\n\nCommon links are opposites, young and adult, part and whole, a worker and their tool, and a thing and its home.',
      example: 'Bird is to nest as bee is to ... A bird lives in a nest. A bee lives in a hive.',
      watch: 'Keep the order the same. If the first pair goes from small to big, the second pair must also go from small to big.' } },
    { id: 'multiple_meanings', name: 'Multiple meanings', lesson: {
      text: 'Some words have two quite different meanings. A bat can be an animal, or something you hit a ball with.\n\nIn this question you see two pairs of words. You need one word that goes with both pairs. It will match the first pair with one of its meanings, and the second pair with its other meaning.\n\nTry each answer option against the first pair, then against the second pair. Only one option will fit both.',
      example: '(shore, riverside) (money, savings). A bank is the side of a river, and a bank is also where money is kept. The answer is bank.',
      watch: 'An option that fits only one of the pairs is a trap. It must fit both.' } },
    { id: 'compound_words', name: 'Compound words', lesson: {
      text: 'A compound word is made by joining two smaller words, such as sun and flower to make sunflower.\n\nYou are given two groups of words. Choose one word from the first group and one from the second group that join to make a real word. The word from the first group always goes first.\n\nSay each pair aloud as one word. Sometimes the sound of the small words changes when they join: "car" and "pet" make "carpet", and "sea" and "son" make "season".',
      example: '(rain, sun, tooth) (ball, flower, room). Sun + flower makes sunflower.',
      watch: 'The new word must be written as one word with no gap. "Tooth ball" and "rain room" are not words.' } },
    { id: 'insert_letter', name: 'Insert a letter', lesson: {
      text: 'You see two pairs of unfinished words with brackets between them. One letter goes in both sets of brackets. That letter finishes the word before the brackets and starts the word after them.\n\nSo the same letter must work four times: it ends two words and begins two words.\n\nStart with the first pair. Think of a letter that could end the first word, then check that it also starts the second word. When you find one, test it in the second pair as well.',
      example: 'tas [ ? ] id and wor [ ? ] ind. Try k: task, kid, work, kind. All four are words, so the answer is k.',
      watch: 'A letter that works for only the first pair is not enough. It must work for both pairs.' } },
    { id: 'hidden_word', name: 'Hidden words', lesson: {
      text: 'A four-letter word is hidden in a sentence. It starts at the end of one word and finishes at the beginning of the next word.\n\nThe letters stay in order and you may not skip any. Ignore the gap between the two words.\n\nSlide along the sentence one pair of words at a time. For each pair, try the last letter of the first word with the first three letters of the next, then the last two with the first two, then the last three with the first one.',
      example: '"Sat on the mat." Look at "the mat": THE + M gives "them". The hidden word is them.',
      watch: 'The hidden word must use letters from both words. A four-letter word sitting inside one word does not count.' } },
    { id: 'missing_three', name: 'Missing three letters', lesson: {
      text: 'In the sentence, one word is written in capitals and has had three letters taken out. The three letters were next to each other, and they spell a proper three-letter word.\n\nRead the sentence and work out what the full word should be. The rest of the sentence gives you the clue.\n\nThen compare the full word with the letters in capitals to see which three are missing. Check that those three letters make a real word, in the right order.',
      example: '"The teacher asked us to LIS carefully." The word should be LISTEN. The missing letters are TEN, and ten is a word.',
      watch: 'The three letters go in as one block. You cannot put them in three different places.' } },
    { id: 'move_letter', name: 'Move a letter', lesson: {
      text: 'You are given two words. Take one letter away from the first word and put it into the second word, so that you have two new, real words.\n\nThe remaining letters of the first word stay in the same order. The letter can go anywhere in the second word, but the other letters there must not change order either.\n\nCover each letter of the first word in turn. If what is left is a real word, try adding that letter to the second word in different places.',
      example: 'beach and eat. Take away b to leave "each". Add b to "eat" to make "beat". The letter that moves is b.',
      watch: 'Both new words must be real words. Check the first word and the second word.' } },
    { id: 'make_word', name: 'Make a word', lesson: {
      text: 'You see two groups of three words. In the first group, the middle word has been made using letters from the two outer words. You must make the middle word of the second group in exactly the same way.\n\nTake each letter of the middle word in turn and find where it came from: which outer word, and which position in that word (first, second, third or fourth letter).\n\nWrite the positions down. Then pick the letters in the same positions from the second group.',
      example: '(cash [ cat ] unit). C is the 1st letter of the left word, A is the 2nd letter of the left word and T is the 4th letter of the right word. Use the same positions in the second group.',
      watch: 'If a letter appears twice in the outer words, try both places and see which gives a real word in the second group.' } },
    { id: 'complete_word', name: 'Complete the word', lesson: {
      text: 'You are given pairs of words in brackets. In each pair, the second word is made from the first word in the same way. Work out the rule and use it to finish the last pair.\n\nNumber the letters of the first word: 1, 2, 3, 4. Then write down which numbers are used to spell the second word, and in what order.\n\nCheck your rule on the second pair. If it works, apply it to the last word.',
      example: '(pair, air) (hear, ear) (wall, ?). Each time the first letter is removed. Wall without its first letter is "all".',
      watch: 'Letters are sometimes rearranged as well as removed. Always check the order, not just which letters are used.' } },
    { id: 'letter_series', name: 'Letter series', lesson: {
      text: 'A letter series is a pattern made with pairs of letters. You must find the next pair.\n\nTreat the first letters of each pair as one pattern, and the second letters as a separate pattern. Use the alphabet printed with the question and count the jumps.\n\nThe jump may be the same every time, such as forward 2. It may go backwards. In harder questions the jump grows: forward 1, then 2, then 3. If you reach Z, carry on counting from A.',
      example: 'AB, CD, EF, GH. First letters: A, C, E, G go forward 2, so next is I. Second letters: B, D, F, H go forward 2, so next is J. The answer is IJ.',
      watch: 'Count the jumps between letters, not the letters themselves. From A to C is a jump of 2.' } },
    { id: 'letter_connections', name: 'Letter connections', lesson: {
      text: 'These questions look like "AB is to CD as PQ is to ?". The first pair of letters has been changed into the second pair. Change the third pair in the same way.\n\nLook at the first letter of each pair and count how far it moved along the alphabet, and in which direction. Do the same for the second letter. The two letters may move by different amounts.\n\nThen move the letters of the third pair by exactly the same amounts.',
      example: 'SU is to TV as PX is to ? S to T is forward 1. U to V is forward 1. So P becomes Q and X becomes Y. The answer is QY.',
      watch: 'Do not mix up the two moves. The first letter uses the first move and the second letter uses the second move.' } },
    { id: 'letter_codes', name: 'Letter codes', lesson: {
      text: 'A word has been turned into a code by moving each letter along the alphabet. You are shown one word with its code. Work out the rule, then use it on another word.\n\nWrite the word above its code and compare them letter by letter. Count how far each letter moved, and in which direction.\n\nSometimes every letter moves the same way. Sometimes the pattern changes along the word, for example forward 1, forward 2, forward 3.\n\nTo decode a code back into a word, do the opposite of the rule.',
      example: 'The code for CAT is DBU. Each letter moved forward 1. So the code for DOG is EPH.',
      watch: 'Check whether the question asks you to make a code or to work out what a code means. They go in opposite directions.' } },
    { id: 'word_number_codes', name: 'Word and number codes', lesson: {
      text: 'Four words are listed with three number codes underneath. Each letter always stands for the same number. The codes are jumbled, and one word has no code shown.\n\nLook for clues. Do two words start with the same letter? Then two codes will start with the same number. Does a word have the same letter in second place as another?\n\nMatch the codes to the words, write down which number stands for each letter, and then use that key to answer the question.',
      example: 'HEAT, MEAT, TEAM, THEM with codes 1836, 5836, 6185. HEAT and MEAT differ only in their first letter, just like 1836 and 5836. The code 6185 has a different pattern, so it is THEM. That gives T = 6, H = 1, E = 8, M = 5 and A = 3, so TEAM is 6835.',
      watch: 'Write the key down letter by letter. Trying to hold it in your head causes mistakes.' } },
    { id: 'number_series', name: 'Number series', lesson: {
      text: 'A number series follows a rule. Find the rule to work out the next number.\n\nStart by finding the gap between each number and the next. If the gap is always the same, keep adding or subtracting it.\n\nIf the gaps change, look at how. They may grow by 1 each time. The numbers may double. Two different steps may take turns. Each number may be the sum of the two before it.\n\nIf nothing fits, look at every other number. Two separate series may have been mixed together.',
      example: '2, 4, 7, 11, 16. The gaps are 2, 3, 4, 5. The next gap is 6, so the next number is 22.',
      watch: 'Check your rule against every number in the series, not only the first three.' } },
    { id: 'related_numbers', name: 'Related numbers', lesson: {
      text: 'You see three groups of numbers. In each group, the number in the middle is made from the two outside numbers using the same rule. Find the rule and use it on the last group.\n\nTry the simple ideas first: add the outside numbers, subtract them, or multiply them. If the answer is close but not right, there may be a second step, such as doubling or adding 1.\n\nAlways test your rule on the second group before using it on the third.',
      example: '(3 [ 15 ] 5) (3 [ 24 ] 8). 3 × 5 = 15 and 3 × 8 = 24, so the rule is multiply. For (10 [ ? ] 4) the answer is 40.',
      watch: 'A rule that works for the first group only is not the rule. It must work for both of the complete groups.' } },
    { id: 'complete_sum', name: 'Complete the sum', lesson: {
      text: 'In these questions a sum has an equals sign in the middle, and one number is missing. Both sides of the equals sign must come to the same total.\n\nWork out the side that is complete. Write the total down.\n\nThen look at the other side and ask what the missing number must be to reach that total. Use the inverse: if the side says "12 + ?", subtract 12 from the total.\n\nRemember to multiply and divide before you add and subtract.',
      example: '11 + 10 = 37 − ?. The left side is 21. So 37 − ? = 21, and the missing number is 16.',
      watch: 'The answer is the missing number, not the total of the side you worked out.' } },
    { id: 'letters_numbers', name: 'Letters for numbers', lesson: {
      text: 'Each letter stands for a number, for example A = 2, B = 5, C = 10. You are given a sum written in letters. Work it out and give the answer as a letter.\n\nRewrite the sum with numbers in place of the letters. Work it out carefully, doing any brackets first, then multiplying and dividing, then adding and subtracting.\n\nFinally, find which letter stands for your answer.',
      example: 'A = 2, B = 5, C = 10. B × A = 5 × 2 = 10. The letter worth 10 is C, so the answer is C.',
      watch: 'The answer must be a letter. Do not stop when you have the number.' } },
    { id: 'logic', name: 'Reading information', lesson: {
      text: 'These are puzzles in words. You are given several facts and must work out something that is not stated directly.\n\nRead every sentence slowly and write down what you learn. Do not try to hold it in your head.\n\nFor questions about order, such as who is tallest, write the names in a line and adjust it with each clue. For questions about who has what, draw a small grid. Tick what you know and cross out what cannot be true. For questions about ages, work out one age at a time.',
      example: 'Tom is taller than Ella. Ella is taller than Aisha. In order: Tom, Ella, Aisha. So Tom is the tallest and Aisha is the shortest.',
      watch: 'Use only the facts you are given. Do not guess or add ideas of your own.' } }
  ],
  flashcards: [
    { front: 'Which letter is 5th in the alphabet?', back: 'E' }, { front: 'Which letter is 10th in the alphabet?', back: 'J' },
    { front: 'Which letter is 13th in the alphabet?', back: 'M' }, { front: 'Which letter is 15th in the alphabet?', back: 'O' },
    { front: 'Which letter is 20th in the alphabet?', back: 'T' }, { front: 'Which letter is 23rd in the alphabet?', back: 'W' },
    { front: 'Which letter comes 3 after R?', back: 'U' }, { front: 'Which letter comes 4 before H?', back: 'D' },
    { front: 'Which letter comes 2 after Y?', back: 'A (carry on from the start)' }, { front: 'What is a synonym?', back: 'A word with the same or nearly the same meaning' },
    { front: 'What is an antonym?', back: 'A word with the opposite meaning' }, { front: 'What is a compound word?', back: 'Two smaller words joined to make one: sun + flower = sunflower' },
    { front: 'Square numbers up to 100', back: '1, 4, 9, 16, 25, 36, 49, 64, 81, 100' }, { front: 'First step in a number series', back: 'Find the gap between each number and the next' },
    { front: 'Puppy is to dog as kitten is to ...', back: 'cat' }, { front: 'A word meaning both "river side" and "place for money"', back: 'bank' }
  ],
  questions: []
};
