/* English course: topics in teaching order, lessons, reading passages and flashcards.
   Passages are original texts written for this app. Questions that belong to a passage carry its id in "p". */
window.BANK = window.BANK || {};
window.BANK.english = {
  id: 'english',
  name: 'English',
  topics: [
    { id: 'spelling', name: 'Spelling', lesson: {
      text: 'Good spellers use tricks, not just memory. Break a long word into syllables and say each part clearly: Wed-nes-day, Feb-ru-ary. Look for small words hiding inside big ones: there is "a rat" in separate and "finite" in definitely.\n\nSome rules help. "i before e, except after c" works when the sound is "ee": believe, but receive. When you add -ing or -ed to a short word with one short vowel, double the last letter: hop becomes hopping.\n\nHomophones sound the same but are spelled differently. "There" is a place, "their" means belonging to them, and "they\'re" is short for they are.',
      example: 'Is it "necessary" or "neccessary"? Think of a shirt: one collar (one c) and two sleeves (two s). So it is necessary.',
      watch: '"It\'s" always means "it is" or "it has". If you cannot swap in "it is", write "its" with no apostrophe: the dog wagged its tail.' } },
    { id: 'vocabulary', name: 'Vocabulary', lesson: {
      text: 'You will often meet a word you do not know. Do not panic: the sentence around it gives clues. Read the whole sentence, cover the hard word, and think about what would make sense in the gap.\n\nLook inside the word too. A prefix at the start can change the meaning: un- and dis- mean "not", re- means "again", mis- means "wrongly". A root you know may be hiding inside, such as "act" in reaction.\n\nThe best way to grow your vocabulary is to read a little every day and collect new words. Use each new word in a sentence of your own so that it sticks.',
      example: '"The children were reluctant to leave the beach." Would children want to leave a beach? Probably not, so reluctant must mean unwilling.',
      watch: 'Do not pick an answer just because it looks or sounds like the word. "Wary" (careful) and "weary" (tired) are close in spelling but not in meaning.' } },
    { id: 'synonyms_antonyms', name: 'Synonyms and antonyms', lesson: {
      text: 'Synonyms are words with the same or nearly the same meaning, such as big and large. Antonyms are opposites, such as hot and cold.\n\nRead the question twice to check which one it wants. Then test each option by putting it into a short sentence in place of the given word. For a synonym, the sentence should mean the same. For an antonym, it should mean the opposite.\n\nMake sure your answer is the same kind of word. If the given word is a verb, such as assist, the answer should be a verb too, such as help.',
      example: 'Find a synonym for "weary": lively, wary, tired. Try a sentence: "After the walk I felt weary." "After the walk I felt tired" means the same, so the answer is tired.',
      watch: 'The opposite is often sitting among the options to catch you out when the question asks for a synonym. Check the question again before you choose.' } },
    { id: 'punctuation', name: 'Punctuation', lesson: {
      text: 'Punctuation tells the reader how to read your sentence. Every sentence starts with a capital letter and ends with a full stop, question mark or exclamation mark.\n\nCommas separate items in a list, and they follow an opening phrase: After lunch, we played outside. Apostrophes do two jobs. They show a missing letter (do not becomes don\'t) and they show belonging (the girl\'s hat).\n\nInverted commas go around the exact words someone says. The punctuation at the end of the speech goes inside them: "Come here," said Dad.\n\nA colon can introduce a list. A semicolon joins two closely linked sentences.',
      example: 'One girl owns a hat: the girl\'s hat. Several girls own hats: the girls\' hats. Find the owner first, then put the apostrophe straight after the owner.',
      watch: 'Plurals do not need an apostrophe. "Two dogs barked" is correct, not "two dog\'s barked".' } },
    { id: 'grammar', name: 'Grammar', lesson: {
      text: 'Words do different jobs in a sentence. A noun names a person, place or thing. A verb is a doing or being word. An adjective describes a noun, and an adverb describes a verb, often ending in -ly. A pronoun, such as he or they, stands in for a noun. A preposition, such as under or after, shows position or time. A conjunction, such as but or because, joins ideas.\n\nThe subject of a sentence does the action, and the verb must match it: the dog runs, the dogs run.\n\nTense shows when something happens. Keep to the same tense unless the time really changes.',
      example: 'In "The tiny kitten slept soundly", kitten is the noun, tiny is the adjective describing it, slept is the verb and soundly is the adverb telling us how it slept.',
      watch: 'Say "we were" and "I did it", not "we was" or "I done it". Tests look for Standard English.' } },
    { id: 'sentence_completion', name: 'Sentence completion', lesson: {
      text: 'In these questions one word is missing from a sentence, and you choose the word that fits best.\n\nRead the whole sentence first and try to think of your own word for the gap before you look at the options. Then find the option closest to your idea.\n\nLook for clue words. "Because" and "so" tell you a reason is coming. "Although", "but" and "despite" tell you there will be a contrast or a surprise.\n\nFinally, read the sentence again with your answer in place. It should make sense and sound right.',
      example: '"Although it was raining, we still went for a walk." The word "still" shows a surprise, so we need a contrast word. "Because" would not make sense.',
      watch: 'Several options may fit the grammar. Choose the one that fits the meaning of the whole sentence, not just the words next to the gap.' } },
    { id: 'cloze', name: 'Cloze passages', lesson: {
      text: 'A cloze passage is a piece of writing with several words missing. Each gap has a number, and you choose the best word for each one.\n\nStart by reading the whole passage quickly, gaps and all, to find out what it is about. Then go back to each gap. Read the sentence before it and the sentence after it, because the clue is not always right beside the gap.\n\nCheck two things for every answer. Does it make sense in the story? Does it fit the grammar, for example the right tense?\n\nIf you are unsure, cross out the options that are clearly wrong and choose from what is left.',
      example: '"She had never ___ alone before." After "had never" we need the form "travelled", not "travel" or "travelling".',
      watch: 'Words that look alike are common traps: struck and stuck, source and sauce. Read each option carefully to the last letter.' } },
    { id: 'comp_fiction', name: 'Comprehension: fiction', lesson: {
      text: 'Comprehension means understanding what you read. Read the passage carefully once before looking at the questions. Then read each question and go back to the text to find the answer. Never rely on memory alone.\n\nSome questions ask for facts that are written in the passage. Others ask you to infer, which means working something out from clues. If a character is "twisting the strap of his bag", the author is showing you that he is nervous without saying so.\n\nYou may also be asked what a word means or why the author chose it. Read the sentence around the word and think about the picture it makes.',
      example: '"His ears turned pink." The text does not say he was embarrassed, but people go pink when they are shy or embarrassed. That is an inference.',
      watch: 'Your answer must come from the passage, not from what you already know or what usually happens in stories.' } },
    { id: 'comp_nonfiction', name: 'Comprehension: non-fiction', lesson: {
      text: 'Non-fiction gives information about the real world. It may explain how something works, describe an event from history or give advice.\n\nUse the layout to help you. Each paragraph usually covers one main idea, so work out which paragraph a question is about and look there.\n\nWatch for numbers, names and dates, because questions often ask about them. Scan the text to find the exact detail.\n\nYou may be asked why the author wrote the passage. Is it to explain, to persuade, to instruct or to describe? Linking words such as "however", "yet" and "because" show how the ideas connect.',
      example: 'A question asks why hedgehogs hibernate. Find the paragraph about hibernation and read it again: "when food becomes hard to find". That is the reason.',
      watch: 'If a question says which is NOT a reason, slow down. You are looking for the one option the passage does not support.' } },
    { id: 'comp_poetry', name: 'Comprehension: poetry', lesson: {
      text: 'Poems pack a lot of meaning into few words. Read the poem twice, slowly. Ask yourself what is actually happening, and what feeling the poet wants to give you.\n\nPoets use special techniques. A simile compares two things using "like" or "as". A metaphor says one thing is another. Personification gives human actions to something that is not human. Onomatopoeia is a word that sounds like its meaning, such as crash. Alliteration repeats the same starting sound.\n\nTo find the rhyme scheme, give each new end sound a letter. If lines 1 and 3 rhyme and lines 2 and 4 rhyme, the scheme is ABAB.',
      example: '"A silver cat on silent paws" describes the sea. The sea is not really a cat, and there is no "like" or "as", so this is a metaphor.',
      watch: 'A simile always has "like" or "as". If the comparison is made without them, it is a metaphor.' } },
    { id: 'creative_writing', name: 'Creative writing', lesson: {
      text: 'Some 11+ tests include a piece of writing. A good plan is the secret, so spend about five minutes planning before you write.\n\nUse five boxes: opening, build-up, problem, resolution and ending. Jot a few words in each. Decide who your main character is and what they want.\n\nWhen you write, show feelings instead of telling them. "Her hands trembled" is stronger than "she was scared". Use the five senses, strong verbs and one or two similes or metaphors. Mix short and long sentences.\n\nKeep the last few minutes to read your work and fix spelling and punctuation.',
      example: 'Telling: "The forest was scary." Showing: "Branches clawed at my coat, and somewhere behind me a twig snapped."',
      watch: 'Do not end with "then I woke up and it was all a dream". Solve the problem inside the story instead.' },
      extra: {
        prompts: [
          'Write a story that begins: "The key was not supposed to fit that door."',
          'Describe a busy market on a hot day. Use at least three senses.',
          'Write a story with the title "The Last Train Home".',
          'You find a map tucked inside a library book. Write about what happens next.',
          'Describe a storm arriving at the seaside.',
          'Write a story in which a character has to be brave even though they are afraid.',
          'Write about a day when everything went wrong, but ended well.',
          'Describe your favourite place so clearly that a stranger could picture it.',
          'Write a story that ends with the sentence: "And that is why I never walk past the old mill without smiling."',
          'A new pupil arrives at school with an unusual pet. Write the story.',
          'Describe a forest at night from the point of view of an animal that lives there.',
          'Write a letter to a friend persuading them to join a club you enjoy.'
        ],
        checklist: [
          'I planned an opening, build-up, problem, resolution and ending.',
          'My opening grabs attention.',
          'I showed feelings through actions instead of naming them.',
          'I used at least three senses.',
          'I used a simile or a metaphor.',
          'I mixed short and long sentences.',
          'I started a new paragraph when the time, place or speaker changed.',
          'I checked my spelling and punctuation.'
        ]
      } }
  ],
  passages: {
    cloze_pool: { kind: 'cloze', title: 'The Rock Pool', text: 'On Saturday morning, Jake and his sister walked down to the (1) to explore the rock pools. The tide was (2), so the rocks were easy to reach. Jake carried a small net and a red (3) for collecting creatures.\n\nIn the first pool they (4) a tiny crab hiding under some seaweed. It scuttled (5) when Jake\'s shadow fell across the water. His sister pointed at a starfish with five orange (6). "Don\'t touch it," she warned. "We should only (7)."\n\nThey watched quietly (8) a small fish darted between the stones. After an hour, the sea began to creep (9) up the sand. "Time to go," said Jake, tipping the water from his bucket (10) into the pool. They climbed the steps and looked back at the (11) waves. It had been a (12) morning.' },
    cloze_train: { kind: 'cloze', title: 'The Night Train', text: 'The night train to Edinburgh pulled out of the station just as the clock (1) ten. Amara pressed her nose against the cold (2) and watched the city lights slide past. She had never (3) alone before, and her stomach fluttered with a mixture of excitement and (4).\n\nThe carriage was almost (5); only an elderly man sat nearby, reading a newspaper. (6) the train gathered speed, the houses gave way to dark fields. Amara unwrapped the sandwiches her father had (7) and checked her ticket for the third time. Somewhere ahead, her aunt would be (8) on the platform.\n\nThe steady rhythm of the wheels was strangely (9), and her eyelids grew heavy. She (10) her coat around her shoulders. (11) she knew it, the guard was gently shaking her arm. "Edinburgh, miss," he said. Amara blinked at the grey morning light and (12) her bag.' },
    cloze_bees: { kind: 'cloze', title: 'The Honeybee', text: 'Honeybees are among the most (1) insects on Earth. A single hive may (2) up to sixty thousand bees, each with a particular job to do. The queen\'s (3) role is to lay eggs, while worker bees collect nectar, build honeycomb and (4) the hive from intruders.\n\nWhen a worker discovers a rich (5) of flowers, she returns and performs a "waggle dance" to (6) the location to the others. The angle of the dance (7) the direction of the flowers in relation to the sun.\n\nBees are also (8) pollinators: as they move from blossom to blossom, they (9) pollen, allowing plants to produce fruit and seeds. (10) this service, many of the foods we eat would become scarce. In recent years, however, bee numbers have (11) because of disease and the loss of wild flowers. Planting bee-friendly gardens is one simple way to (12) their survival.' },
    fic_lighthouse: { kind: 'prose', title: 'The Lighthouse Key', text: 'Mira had always been told never to climb the lighthouse stairs alone. But tonight the lamp at the top had gone dark, and Grandpa Joe was fast asleep in his armchair, his glasses slipping down his nose.\n\nOut at sea, a fishing boat was creeping towards the rocks. Mira could see its small green light bobbing like a firefly in the mist. Her heart thumped. Without the lamp, the crew would never see the danger.\n\nShe lifted the heavy brass key from its hook and started up the spiral staircase. There were one hundred and twenty steps, and every one of them groaned beneath her feet. The wind howled through the cracks in the walls and tugged at her sleeves with icy fingers.\n\nAt the top, her own fingers were so cold that she dropped the key twice. At last the little door swung open. She remembered what Grandpa had shown her: turn the handle, wait for the hiss, strike the match. A golden beam swept out across the water.\n\nFar below, the green light turned slowly away from the rocks. Mira let out a long breath and smiled. She would be in trouble in the morning, but she did not mind one bit.' },
    fic_newboy: { kind: 'prose', title: 'The New Boy', text: 'When Daniel walked into Class 6B on a wet Monday in January, nobody looked up. He stood by the door, twisting the strap of his rucksack, until Mrs Okafor waved him towards an empty seat beside the window.\n\nAt break, the others raced outside to play football. Daniel stayed at his desk and took out a small notebook. Page after page was filled with drawings: dragons with wings like torn sails, cities floating on clouds, a robot watering a garden.\n\n"Did you do those?" asked a voice. It was Hattie, who had come back for her coat. Daniel nodded, his ears turning pink.\n\n"They\'re brilliant," said Hattie. "We need someone to design the poster for the school play. Our last one looked like a squashed spider."\n\nDaniel laughed before he could stop himself. It was the first sound he had made all morning.\n\nBy Friday, his poster was pinned to every noticeboard in the school, and three people had asked him to draw dragons on their pencil cases. Daniel still did not like football. But he had stopped twisting the strap of his rucksack.' },
    fic_fox: { kind: 'prose', title: 'The Storm Fox', text: 'The fox came on the third night of the storm.\n\nEwan saw it first: a thin, rust-coloured shape pressed against the back door, its fur plastered flat by the rain. He knew what his mother would say. Foxes were thieves. Foxes took chickens. Only last spring, they had lost six hens in a single night.\n\nBut this fox was not hunting. One of its front paws was held off the ground, and it shivered so hard that its whole body shook.\n\nEwan fetched an old towel and a saucer of water and set them down in the porch, then retreated to the kitchen step. For a long time, the fox did not move. Its amber eyes never left him. Then, inch by inch, it limped forward and began to drink.\n\nEvery evening that week, Ewan left scraps in the porch. Every evening, the fox came a little sooner and stayed a little longer. He never tried to touch it. Some things, he decided, are better left wild.\n\nOn the seventh day the sky cleared, and the porch was empty. Only a single muddy paw print remained on the towel, like a signature at the end of a letter.' },
    nf_hedgehog: { kind: 'prose', title: 'Hedgehogs: Night Visitors', text: 'If you hear snuffling in the garden after dark, you may have a hedgehog for a neighbour. These small mammals are nocturnal, which means they sleep during the day and come out at night to feed.\n\nA hedgehog\'s back is covered with around five thousand sharp spines. When it senses danger, it rolls into a tight ball so that only the prickles are showing. Few animals are willing to bite such a spiky mouthful.\n\nHedgehogs are a gardener\'s friend because they eat beetles, caterpillars and slugs. In a single night, one hedgehog may walk up to two kilometres in search of food. Solid fences are a problem for them, so wildlife experts ask people to cut a small gap at the bottom of a fence to make a "hedgehog highway".\n\nIn late autumn, when food becomes hard to find, hedgehogs build a nest of leaves and hibernate until spring. During this deep sleep, their heartbeat slows right down to save energy.\n\nIf you would like to help, put out a shallow dish of water and some meaty cat food. Never give hedgehogs milk: it makes them ill.' },
    nf_volcano: { kind: 'prose', title: 'Mountains of Fire', text: 'Deep beneath your feet, the Earth is astonishingly hot. Many kilometres down, rock becomes so hot that it melts into a thick liquid called magma. A volcano is an opening in the Earth\'s crust where this magma can escape.\n\nWhen pressure builds up underground, magma is forced upwards through a channel called a vent. Once it bursts out at the surface, it is known as lava. An eruption may also hurl out ash, steam and lumps of rock.\n\nMost volcanoes are found where the giant plates that make up the Earth\'s crust meet. So many lie around the edge of the Pacific Ocean that the region is nicknamed the "Ring of Fire".\n\nEruptions can be deadly. In AD 79, Mount Vesuvius in Italy buried the Roman town of Pompeii under ash. Yet millions of people still choose to live near volcanoes. One reason is that volcanic ash breaks down into rich soil, which is excellent for growing crops.\n\nToday, scientists called volcanologists monitor volcanoes closely. Small earthquakes and changes in gases often give a warning, so people can be moved to safety before an eruption begins.' },
    nf_fire: { kind: 'prose', title: 'The Great Fire of London', text: 'In the early hours of 2 September 1666, a fire broke out in Thomas Farriner\'s bakery in Pudding Lane. At first, nobody was especially worried. Fires were common in London, and they were usually put out quickly.\n\nThis time was different. The summer had been long and dry, and a strong wind was blowing from the east. Most of the houses were built of wood and stood so close together that neighbours could almost shake hands across the street. The flames leapt easily from roof to roof.\n\nThere was no fire brigade. People passed leather buckets of water along in chains and used long hooks to pull down buildings in the path of the flames. Many loaded their belongings onto carts or boats and fled. Samuel Pepys, who described the fire in his famous diary, even buried a valuable cheese in his garden to keep it safe.\n\nThe fire burned for four days. By the time it was finally under control, more than thirteen thousand houses and the old St Paul\'s Cathedral had been destroyed.\n\nLondon was rebuilt with wider streets and houses of brick and stone. The architect Sir Christopher Wren designed a magnificent new St Paul\'s, which still stands today.' },
    po_tide: { kind: 'poem', title: 'The Tide', text: 'The sea comes creeping up the sand,\nA silver cat on silent paws;\nIt licks the castles children planned\nAnd steals their moats with foamy claws.\n\nIt hides the footprints, one by one,\nAnd tucks the pebbles into bed;\nIt swallows up the setting sun\nAnd paints the evening water red.\n\nThen, yawning, back it slips once more\nAnd leaves its gifts along the shore:\nA shell, a stone, a ribbon of weed,\nA message only gulls can read.' },
    po_shed: { kind: 'poem', title: 'Grandad\'s Shed', text: 'At the bottom of the garden, where the nettles grow tall,\nStands a crooked wooden shed with ivy on the wall.\nThe door complains on rusty hinges, creak and groan and squeak,\nAnd inside it smells of sawdust, oil and garden leek.\n\nThere are jam jars full of buttons, bolts and bent old nails,\nA fishing rod, a broken clock, a pair of kitchen scales.\nThere\'s a radio that crackles like a fire made of rain,\nAnd a window grey with cobwebs where the spiders entertain.\n\nMy grandad says it\'s rubbish, but he never throws it out;\nHe says a thing is useful if you turn it round about.\nSo we mend and make and tinker till the stars come out to see,\nAnd the best thing in that crooked shed is Grandad there with me.' },
    po_owl: { kind: 'poem', title: 'The Owl', text: 'When daylight folds its golden wings\nAnd shadows pool beneath the trees,\nA hush falls over living things,\nA held breath on the evening breeze.\n\nThen, pale as moonlight, soft as snow,\nThe hunter leaves her hollow oak;\nNo whisper tells the world below,\nNo feather stirs the chimney smoke.\n\nThe field mouse freezes in the wheat,\nA heartbeat hidden in the grain;\nHe hears no wingbeat, feels no heat,\nThen scurries to his hole again.\n\nShe circles once, a drifting ghost,\nAnd settles on the old gate post,\nPatient as the turning year:\nThe night is long, and she is here.' }
  },
  flashcards: [
    { front: 'reluctant', back: 'unwilling; not wanting to do something' }, { front: 'abundant', back: 'plentiful; more than enough' },
    { front: 'tranquil', back: 'calm and peaceful' }, { front: 'meticulous', back: 'very careful about small details' },
    { front: 'ominous', back: 'suggesting that something bad will happen' }, { front: 'benevolent', back: 'kind and generous' },
    { front: 'conceal', back: 'to hide' }, { front: 'diligent', back: 'hard-working and careful' },
    { front: 'obstinate', back: 'stubborn' }, { front: 'scarce', back: 'in short supply; hard to find' },
    { front: 'weary', back: 'tired' }, { front: 'wary', back: 'careful and watchful' },
    { front: 'vivid', back: 'bright, clear and full of detail' }, { front: 'precarious', back: 'unsafe; likely to fall' },
    { front: 'famished', back: 'extremely hungry' }, { front: 'console', back: 'to comfort someone who is sad' },
    { front: 'cunning', back: 'clever at tricking others' }, { front: 'diminish', back: 'to become less or smaller' },
    { front: 'plausible', back: 'believable' }, { front: 'frugal', back: 'careful not to waste money' },
    { front: 'resilient', back: 'able to recover quickly from difficulties' }, { front: 'scrutinise', back: 'to examine very carefully' },
    { front: 'ambiguous', back: 'having more than one possible meaning' }, { front: 'flourish', back: 'to grow well; to thrive' },
    { front: 'opaque', back: 'not see-through (the opposite of transparent)' }, { front: 'hostile', back: 'unfriendly' },
    { front: 'arid', back: 'very dry' }, { front: 'timid', back: 'shy and easily frightened' },
    { front: 'fragile', back: 'easily broken' }, { front: 'peculiar', back: 'strange; unusual' },
    { front: 'What is a simile?', back: 'A comparison using "like" or "as"' }, { front: 'What is a metaphor?', back: 'Saying one thing is another: "the classroom was a zoo"' },
    { front: 'What is personification?', back: 'Giving human actions or feelings to something that is not human' },
    { front: 'What is onomatopoeia?', back: 'A word that sounds like its meaning: crash, buzz, hiss' },
    { front: 'What is alliteration?', back: 'Words close together that start with the same sound' },
    { front: 'there, their or they\'re?', back: 'there = a place; their = belonging to them; they\'re = they are' }
  ],
  questions: []
};

/* Deeper lesson notes: a step-by-step method, things to check and common traps for every English topic. */
(function () {
  const more = {
    spelling: {
      method: ['Say the word slowly and split it into syllables: Feb-ru-ar-y.', 'Look for small words hiding inside big ones: "a rat" in separate.', 'Use rules: i before e except after c (when it sounds like "ee"); double the last letter after a short vowel (hopping).', 'Picture the word written in a book. Does it look right?'],
      checklist: ['Syllables', 'Double letters', 'Silent letters', 'Homophones', 'Word endings (-tion, -cious, -ible)'],
      traps: ['Mixing up there, their and they\'re.', 'Writing words the way you say them (Wensday for Wednesday).']
    },
    vocabulary: {
      method: ['Read the whole sentence, not just the word.', 'Cover the word and think what would make sense in the gap.', 'Look for clues: the word\'s parts (un-, -ful, -less) and nearby words.', 'Put each option back into the sentence and choose the one that keeps the meaning.'],
      checklist: ['Context clues', 'Prefixes and suffixes', 'Try it in the sentence'],
      traps: ['Choosing a word that looks similar rather than means the same.']
    },
    synonyms_antonyms: {
      method: ['Synonyms mean the same. Antonyms mean the opposite. Check which the question wants.', 'Think of the word in a sentence first.', 'Test each option in the same sentence.', 'Make sure the words are the same kind (both describing words, both doing words).'],
      checklist: ['Same or opposite?', 'Same kind of word', 'Try it in a sentence'],
      traps: ['Giving a synonym when the question asks for an antonym.']
    },
    punctuation: {
      method: ['Every sentence starts with a capital letter and ends with a full stop, question mark or exclamation mark.', 'Commas separate items in a list and mark off extra information.', 'Apostrophes show missing letters (don\'t) or belonging (the dog\'s bone).', 'Speech marks go around the words actually spoken, with the punctuation inside.'],
      checklist: ['Capital letters', 'End marks', 'Commas', 'Apostrophes', 'Speech marks'],
      traps: ['Putting an apostrophe in plurals (apple\'s for sale).', 'Writing it\'s when you mean its.']
    },
    grammar: {
      method: ['Find the verb: the doing or being word. Check it matches its subject (he runs, they run).', 'Keep the tense the same through a sentence unless the time changes.', 'Know your word classes: noun, verb, adjective, adverb, pronoun, preposition, conjunction.', 'Read the sentence aloud quietly. Does it sound right?'],
      checklist: ['Subject and verb agree', 'Tense', 'Word classes', 'Sounds right'],
      traps: ['Writing "could of" instead of "could have".', 'Switching between past and present in one sentence.']
    },
    sentence_completion: {
      method: ['Read the whole sentence before choosing.', 'Decide what kind of word is needed (a noun, a verb, a describing word).', 'Try each option in the gap.', 'Choose the one that makes sense and sounds right.'],
      checklist: ['Kind of word', 'Meaning', 'Grammar'],
      traps: ['Choosing a word that makes sense but does not fit grammatically (a, an, plurals).']
    },
    cloze: {
      method: ['Read the whole passage first to understand it.', 'For each gap, read the sentence before and after.', 'Decide what kind of word fits, then try the options.', 'Reread the finished sentence.'],
      checklist: ['Whole passage first', 'Sentence before and after', 'Grammar', 'Meaning'],
      traps: ['Filling a gap using only the words right next to it.']
    },
    comp_fiction: {
      method: ['Read the passage once for the story. Who? Where? What happens?', 'Read each question carefully. Underline the key word (why, how, which, feel).', 'Go back to the passage and find the exact lines that answer it.', 'For "how does the character feel?", look at what they say and do, not just the feelings words.', 'Rule out options that are not supported by the text.'],
      checklist: ['Who, where, what', 'Find the lines', 'Clues to feelings', 'Writer\'s word choices'],
      traps: ['Answering from your own ideas instead of the text.', 'Choosing an option that is true but does not answer the question.']
    },
    comp_nonfiction: {
      method: ['Skim the title, headings and first lines to see what the text is about.', 'Read the question and find the key word.', 'Scan the text for that word or idea, then read that part closely.', 'Watch the difference between facts and opinions.'],
      checklist: ['Headings', 'Key words', 'Fact or opinion', 'Purpose of the text'],
      traps: ['Choosing a fact from the wrong part of the text.', 'Mixing up what the writer thinks with what is true.']
    },
    comp_poetry: {
      method: ['Read the poem twice, once to enjoy it and once to understand it.', 'Use the line numbers the question gives you.', 'Look for images: similes (like, as) and metaphors (saying something is something else).', 'Think about the mood: how does the poem make you feel, and which words do that?'],
      checklist: ['Line numbers', 'Similes and metaphors', 'Mood', 'Rhyme and rhythm'],
      traps: ['Taking images literally (a "sea of faces" is a crowd, not water).']
    },
    creative_writing: {
      method: ['Spend 5 minutes planning: beginning, problem, ending.', 'Open with something that grabs the reader: action, speech or a question.', 'Use your senses: what can be seen, heard, smelt and felt?', 'Vary your sentences: short ones for tension, longer ones for description.', 'Leave 5 minutes to check spelling and punctuation.'],
      checklist: ['Plan', 'Strong opening', 'Senses', 'Varied sentences', 'Paragraphs', 'Check'],
      traps: ['Starting without a plan and running out of time before the ending.', 'Too much "and then" instead of description.']
    }
  };
  window.BANK.english.topics.forEach(t => Object.assign(t.lesson, more[t.id] || {}));
})();
