/* English question generators built from word lists: spelling, homophones, grammar, word classes,
   synonyms and antonyms, and apostrophes. Reading comprehension, cloze and creative writing keep
   their hand-written passages. */
(function () {
'use strict';
const { choices, Q } = window.GENCORE;

// ------------------------------------------------------------ spelling
// Words with a short meaning, grouped by level (Year 3-4 list, Year 5-6 list, harder words).
const SPELL = [
  [['because', 'for the reason that'], ['friend', 'a person you know well and like'], ['Wednesday', 'the day after Tuesday'], ['February', 'the second month of the year'], ['library', 'a place where you borrow books'], ['separate', 'apart, not joined together'], ['different', 'not the same'], ['beautiful', 'very pretty'], ['believe', 'to think something is true'], ['business', 'a company that sells things'], ['calendar', 'a chart showing the days of the year'], ['certain', 'completely sure'], ['difficult', 'hard to do'], ['disappear', 'to go out of sight'], ['early', 'before the usual time'], ['enough', 'as much as is needed'], ['favourite', 'liked best of all'], ['guard', 'to keep watch over'], ['heart', 'the organ that pumps blood'], ['island', 'land with water all around it'], ['knowledge', 'what you know'], ['minute', 'sixty seconds'], ['occasion', 'a special event'], ['often', 'many times'], ['peculiar', 'strange or odd'], ['probably', 'very likely'], ['quarter', 'one of four equal parts'], ['strength', 'how strong something is'], ['surprise', 'something you did not expect'], ['thought', 'an idea in your mind']],
  [['accommodate', 'to give someone a place to stay'], ['achieve', 'to succeed in doing something'], ['aggressive', 'ready to attack or argue'], ['ancient', 'very old'], ['apparent', 'easy to see or understand'], ['awkward', 'clumsy or uncomfortable'], ['bargain', 'something bought cheaply'], ['committee', 'a group chosen to make decisions'], ['community', 'people living in one area'], ['conscience', 'the feeling that tells you right from wrong'], ['curiosity', 'wanting to know things'], ['definitely', 'without any doubt'], ['desperate', 'in great need'], ['embarrass', 'to make someone feel awkward'], ['environment', 'the world around us'], ['equipment', 'the things needed for a job'], ['especially', 'more than usual'], ['exaggerate', 'to make something sound bigger than it is'], ['excellent', 'very, very good'], ['familiar', 'well known to you'], ['foreign', 'from another country'], ['government', 'the people who run a country'], ['immediately', 'at once'], ['interrupt', 'to break in while someone is talking'], ['marvellous', 'wonderful'], ['necessary', 'needed'], ['neighbour', 'someone who lives next door'], ['occupy', 'to fill a space or time'], ['parliament', 'the place where laws are made'], ['persuade', 'to get someone to agree'], ['physical', 'to do with the body'], ['prejudice', 'an unfair opinion formed without good reason'], ['privilege', 'a special right'], ['pronunciation', 'the way a word is said'], ['recommend', 'to suggest as good'], ['restaurant', 'a place where you buy and eat meals'], ['rhythm', 'a regular beat'], ['secretary', 'a person who keeps records and letters'], ['sincerely', 'truly and honestly'], ['soldier', 'a person in an army'], ['stomach', 'where food goes after you swallow'], ['sufficient', 'enough'], ['temperature', 'how hot or cold something is'], ['thorough', 'careful and complete'], ['vegetable', 'a plant grown for food'], ['vehicle', 'something used to carry people or goods']],
  [['acquaintance', 'someone you know slightly'], ['conscientious', 'careful to do things well'], ['correspondence', 'letters sent between people'], ['guarantee', 'a firm promise'], ['harass', 'to keep annoying or worrying someone'], ['hierarchy', 'a ranking of levels from top to bottom'], ['irresistible', 'too tempting to refuse'], ['liaise', 'to work together and share information'], ['manoeuvre', 'a careful movement'], ['mischievous', 'playfully naughty'], ['occurrence', 'something that happens'], ['perseverance', 'keeping going when things are hard'], ['playwright', 'a person who writes plays'], ['questionnaire', 'a set of written questions'], ['reminiscent', 'reminding you of something'], ['silhouette', 'a dark shape against a light background'], ['surveillance', 'close watch kept over someone'], ['unnecessary', 'not needed'], ['vacuum', 'a space with nothing in it'], ['withhold', 'to hold back or refuse to give']]
];
// Believable misspellings made by the mistakes children really make.
function misspell(w, r) {
  const out = new Set(), lw = w.toLowerCase();
  const put = s => { if (s && s !== w && s.length > 2) out.add(w[0] === w[0].toUpperCase() ? s[0].toUpperCase() + s.slice(1) : s); };
  const s = lw;
  for (let i = 1; i < s.length; i++) if (s[i] === s[i - 1]) put(s.slice(0, i) + s.slice(i + 1));                 // drop a double letter
  for (let i = 1; i < s.length - 1; i++) if ('bcdfglmnprst'.includes(s[i]) && s[i] !== s[i - 1] && s[i] !== s[i + 1] && 'aeiou'.includes(s[i - 1])) put(s.slice(0, i) + s[i] + s.slice(i)); // double a single letter
  put(s.replace('ie', 'ei')); put(s.replace('ei', 'ie'));
  put(s.replace(/ence$/, 'ance')); put(s.replace(/ance$/, 'ence')); put(s.replace(/ent$/, 'ant')); put(s.replace(/ant$/, 'ent'));
  put(s.replace(/ible$/, 'able')); put(s.replace(/able$/, 'ible')); put(s.replace(/tion$/, 'sion')); put(s.replace(/sion$/, 'tion'));
  put(s.replace(/ly$/, 'ley')); put(s.replace(/ous$/, 'us')); put(s.replace(/our$/, 'or')); put(s.replace(/ary$/, 'ery')); put(s.replace(/ery$/, 'ary'));
  put(s.replace('ph', 'f')); put(s.replace('gh', 'f')); put(s.replace('ck', 'k')); put(s.replace('c', 'k')); put(s.replace('s', 'c'));
  put(s.replace(/([^aeiou])h/, '$1')); put(s.replace(/^k(n)/, '$1')); put(s.replace(/^w(r)/, '$1')); put(s.replace('mb', 'm'));                   // silent letters
  const v = [...s].map((c, i) => 'aeiou'.includes(c) ? i : -1).filter(i => i > 0);
  v.forEach(i => { put(s.slice(0, i) + s.slice(i + 1)); ['a', 'e', 'i', 'o', 'u'].filter(c => c !== s[i]).forEach(c => put(s.slice(0, i) + c + s.slice(i + 1))); });
  return r.shuffle([...out]).sort((a, b) => sim(a, w) - sim(b, w));
}
const sim = (a, b) => { let d = Math.abs(a.length - b.length); for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) d++; return d; };   // closest-looking first
const HOMO = [
  ['They left ___ coats on the bus.', 'their', ['there', "they're", 'thier', 'theyr']], ['Put the box over ___, by the door.', 'there', ['their', "they're", 'thare', 'ther']], ["I think ___ going to be late.", "they're", ['their', 'there', 'theyre', "their're"]],
  ['The dog wagged ___ tail.', 'its', ["it's", 'its\'', 'it', 'itz']], ["___ raining again today.", "It's", ['Its', "Its'", 'It', 'Itz']],
  ['I would like ___ apples, please.', 'two', ['to', 'too', 'tow', 'tu']], ['We walked ___ the shop.', 'to', ['too', 'two', 'tow', 'toe']], ['This soup is ___ hot to eat.', 'too', ['to', 'two', 'tow', 'toe']],
  ['Have you ___ the new film?', 'seen', ['scene', 'seem', 'sean', 'seene']], ['The ___ was set in a dark forest.', 'scene', ['seen', 'seem', 'sene', 'sceen']],
  ['She ___ the race easily.', 'won', ['one', 'wun', 'own', 'wone']], ['I can ___ the sea from my window.', 'see', ['sea', 'sée', 'cee', 'si']],
  ['The wind ___ the leaves off the tree.', 'blew', ['blue', 'blow', 'bloo', 'blewe']], ['Do you ___ the answer?', 'know', ['no', 'now', 'knoe', 'kno']],
  ['We will ___ for the bus.', 'wait', ['weight', 'wate', 'weit', 'whait']], ['What is the ___ of this parcel?', 'weight', ['wait', 'wieght', 'wate', 'weigt']],
  ['I ___ the ball to my friend.', 'threw', ['through', 'thru', 'throo', 'thew']], ['We walked ___ the tunnel.', 'through', ['threw', 'thru', 'throught', 'trough']],
  ['___ book is this?', 'Whose', ["Who's", 'Whos', 'Hose', 'Whoes']], ["___ coming to the party?", "Who's", ['Whose', 'Whos', 'Hoos', 'Whoes']],
  ['Please ___ quiet in the library.', 'be', ['bee', 'bea', 'b', 'bi']], ['The ___ landed on the flower.', 'bee', ['be', 'bea', 'bey', 'bie']],
  ['Can I have a ___ of cake?', 'piece', ['peace', 'peice', 'pease', 'peece']], ['After the war came years of ___.', 'peace', ['piece', 'peice', 'pease', 'peese']],
  ['We ___ our dinner at six.', 'ate', ['eight', 'ait', 'aight', 'eate']], ['Can you ___ me later?', 'meet', ['meat', 'mete', 'meit', 'meeat']]
];
function spelling(r, d) {
  if (d <= 2 && r() < .35) {
    const [sent, ans, wrong] = r.pick(HOMO);
    const c = choices(r, ans, wrong);
    return Q(`Which word correctly completes the sentence?\n${sent}`, c, 'Say the sentence with each word. Which spelling has the right meaning here?', [`These words sound the same but mean different things.`, `"${ans}" is the one that makes sense in: ${sent.replace('___', ans.toUpperCase())}`]);
  }
  const list = SPELL[d - 1], [w, def] = r.pick(list), wrong = misspell(w, r);
  const c = choices(r, w, wrong);
  if (!c) return null;
  return Q(`Which is the correct spelling of the word that means '${def}'?`, c, 'Say the word slowly in syllables, then picture how it looks in a book.', ['Break the word into syllables and check each part. Look out for double letters, silent letters and tricky endings.', `The correct spelling is ${w}.`]);
}

// ------------------------------------------------------------ grammar
const SUBJ_S = ['My sister', 'The teacher', 'Our dog', 'The baker', 'A robin', 'The goalkeeper', 'Grandad'];
const SUBJ_P = ['The children', 'My friends', 'Our neighbours', 'The players', 'The ducks', 'Both teams'];
const VERBS = [['walk', 'walks', 'walked', 'walking'], ['play', 'plays', 'played', 'playing'], ['swim', 'swims', 'swam', 'swimming'], ['run', 'runs', 'ran', 'running'], ['go', 'goes', 'went', 'going'], ['write', 'writes', 'wrote', 'writing'], ['sing', 'sings', 'sang', 'singing'], ['eat', 'eats', 'ate', 'eating']];
const PLACES = { walk: 'to school', play: 'in the park', swim: 'in the lake', run: 'around the field', go: 'to the market', write: 'a story', sing: 'in the choir', eat: 'lunch at noon' };
const COMP = [['good', 'better', 'best', 'My second drawing was ___ than my first.', 'That was the ___ film I have ever seen.'], ['bad', 'worse', 'worst', 'The storm today was ___ than the one yesterday.', 'It was the ___ weather of the whole year.'], ['tall', 'taller', 'tallest', 'The giraffe is ___ than the zebra.', 'Sam is the ___ person in our class.'], ['happy', 'happier', 'happiest', 'Our dog seems ___ since we moved house.', 'It was the ___ day of my life.'], ['big', 'bigger', 'biggest', 'An elephant is ___ than a horse.', 'The blue whale is the ___ animal on Earth.'], ['funny', 'funnier', 'funniest', 'This comic is ___ than the last one.', 'That was the ___ joke in the whole book.']];
// Word-class sentences built from labelled parts, so the class of every word is known.
const WC = { det: ['The', 'A'], adj: ['clever', 'sleepy', 'enormous', 'tiny', 'brave', 'noisy', 'gentle'], noun: ['fox', 'giant', 'kitten', 'pirate', 'robot', 'dragon', 'farmer'], verb: ['crept', 'jumped', 'raced', 'tiptoed', 'climbed', 'wandered'], adv: ['quickly', 'silently', 'carefully', 'happily', 'bravely', 'slowly'], prep: ['over', 'under', 'across', 'through', 'behind', 'past'], noun2: ['fence', 'bridge', 'river', 'hedge', 'castle', 'meadow'] };
const WCNAME = { adj: 'an adjective (a describing word)', noun: 'a noun (a naming word)', verb: 'a verb (a doing word)', adv: 'an adverb (it tells you how)', prep: 'a preposition (it tells you where)' };
function grammar(r, d) {
  const kind = d === 1 ? r.pick(['agree', 'tense', 'wordclass']) : d === 2 ? r.pick(['agree', 'tense', 'compare', 'wordclass']) : r.pick(['couldhave', 'compare', 'wordclass', 'tense']);
  if (kind === 'agree') {
    const v = r.pick(VERBS), plural = r() < .5, sj = r.pick(plural ? SUBJ_P : SUBJ_S), ans = plural ? v[0] : v[1];
    const c = choices(r, ans, [plural ? v[1] : v[0], v[3], plural ? 'is ' + v[3] : 'are ' + v[3], plural ? v[1] + 'es' : v[0] + 'ed', 'be ' + v[3]]);
    return Q(`Which word correctly completes the sentence?\n${sj} ___ ${PLACES[v[0]]} every day.`, c, 'Is the subject one person or thing, or more than one?', [`"${sj}" is ${plural ? 'more than one' : 'one'}, so the verb is "${ans}".`, '"Every day" tells us it happens regularly, so we use the present tense.']);
  }
  if (kind === 'tense') {
    const v = r.pick(VERBS), when = r.pick([['Yesterday', 'past'], ['Last week', 'past'], ['Right now', 'now'], ['Tomorrow', 'future']]), sj = r.pick(SUBJ_P);
    const ans = when[1] === 'past' ? v[2] : when[1] === 'now' ? 'are ' + v[3] : 'will ' + v[0];
    const c = choices(r, ans, [v[0], v[1], 'are ' + v[3], v[2], 'will ' + v[0], 'is ' + v[3]].filter(x => x !== ans));
    return Q(`Which words correctly complete the sentence?\n${when[0]}, ${sj.charAt(0).toLowerCase() + sj.slice(1)} ___ ${PLACES[v[0]]}.`, c, 'Look at the first words of the sentence. Do they tell you it is the past, now or the future?', [`"${when[0]}" tells us the time: ${when[1] === 'past' ? 'the past' : when[1] === 'now' ? 'happening at this moment' : 'the future'}.`, `So the verb is "${ans}".`]);
  }
  if (kind === 'compare') {
    const [base, er, est, sEr, sEst] = r.pick(COMP), most = r() < .5, ans = most ? est : er;
    const wrong = most ? [er, 'most ' + base, base + 'est', 'more ' + est] : [est, 'more ' + base, base + 'er', 'more ' + er];
    const c = choices(r, ans, wrong.filter(x => x !== ans));
    return Q(`Which word correctly completes the sentence?\n${most ? sEst : sEr}`, c, most ? 'Comparing three or more things uses -est or "most".' : 'Comparing two things uses -er or "more".', [most ? 'We are comparing one thing with all the others, so we need the "most" form.' : 'We are comparing two things, so we need the "-er" form.', `For "${base}" that word is "${ans}".`]);
  }
  if (kind === 'couldhave') {
    const m = r.pick(['could', 'would', 'might']), [v3, v1, obj] = r.pick([['gone', 'go', 'to the beach'], ['eaten', 'eat', 'our picnic outside'], ['seen', 'see', 'the fireworks'], ['taken', 'take', 'the boat out']]);
    const ans = `${m} have ${v3}`;
    const c = choices(r, ans, [`${m} of ${v3}`, `${m} have ${v1}`, `${m} of ${v1}`, `${m} has ${v3}`, `${m} had ${v1}`]);
    return Q(`Which words correctly complete the sentence?\nWe ___ ${obj} if it had not rained.`, c, 'Listen carefully: "could\'ve" is short for "could have", not "could of".', [`"${m}'ve" is short for "${m} have". "${m} of" is never correct.`, `After "have" we use the form "${v3}".`]);
  }
  // word classes
  const p = {}; Object.keys(WC).forEach(k => { p[k] = r.pick(WC[k]); });
  if (p.adj === p.noun) return null;
  const det = p.det === 'A' && 'aeiou'.includes(p.adj[0]) ? 'An' : p.det;
  const sentence = `${det} ${p.adj} ${p.noun} ${p.verb} ${p.adv} ${p.prep} the ${p.noun2}.`;
  const ask = d === 1 ? r.pick(['adj', 'noun', 'verb']) : r.pick(['adj', 'verb', 'adv', 'prep', 'noun']);
  const ans = p[ask], others = ['adj', 'noun', 'verb', 'adv', 'prep', 'noun2'].filter(k => k !== ask && !(ask === 'noun' && k === 'noun2')).map(k => p[k]);
  const c = choices(r, ans, others);
  return Q(`Which word in this sentence is ${WCNAME[ask]}?\n${sentence}`, c, 'Ask what job each word does in the sentence.', [`${ask === 'adj' ? `"${ans}" describes the ${p.noun}.` : ask === 'noun' ? `"${ans}" names who the sentence is about.` : ask === 'verb' ? `"${ans}" is the action: what the ${p.noun} did.` : ask === 'adv' ? `"${ans}" tells us how the ${p.noun} ${p.verb}.` : `"${ans}" tells us where: ${p.prep} the ${p.noun2}.`}`, `So "${ans}" is ${WCNAME[ask].split(' (')[0]}.`]);
}

// ------------------------------------------------------------ synonyms and antonyms
const SYN = [['big', 'large', 'tiny'], ['happy', 'cheerful', 'miserable'], ['quick', 'rapid', 'slow'], ['brave', 'courageous', 'cowardly'], ['ancient', 'old', 'modern'], ['angry', 'furious', 'calm'], ['begin', 'start', 'finish'], ['difficult', 'hard', 'easy'], ['enormous', 'huge', 'minute'], ['frightened', 'scared', 'fearless'], ['generous', 'giving', 'mean'], ['gloomy', 'dark', 'bright'], ['hopeful', 'optimistic', 'despairing'], ['inquisitive', 'curious', 'uninterested'], ['sorrowful', 'sad', 'joyful'], ['vacant', 'empty', 'occupied'], ['scarce', 'rare', 'plentiful'], ['victory', 'win', 'defeat'], ['wealthy', 'rich', 'poor'], ['shout', 'yell', 'whisper'], ['ascend', 'climb', 'descend'], ['permit', 'allow', 'forbid'], ['feeble', 'weak', 'strong'], ['transparent', 'clear', 'opaque'], ['humble', 'modest', 'arrogant'], ['conceal', 'hide', 'reveal'], ['reluctant', 'unwilling', 'eager'], ['tranquil', 'peaceful', 'chaotic'], ['vast', 'immense', 'narrow'], ['frequent', 'regular', 'rare']];
// Words that mean much the same thing, so they are never offered as wrong answers for each other.
const SAME = [['big', 'large', 'enormous', 'huge', 'vast', 'immense'], ['tiny', 'minute', 'narrow'], ['happy', 'cheerful', 'joyful', 'hopeful', 'optimistic', 'eager'], ['sad', 'sorrowful', 'miserable', 'gloomy', 'despairing'], ['calm', 'tranquil', 'peaceful'], ['rare', 'scarce'], ['old', 'ancient'], ['scared', 'frightened', 'cowardly'], ['brave', 'courageous', 'fearless'], ['dark', 'gloomy'], ['rich', 'wealthy'], ['poor', 'mean'], ['strong', 'immense'], ['weak', 'feeble'], ['quick', 'rapid'], ['plentiful', 'frequent', 'regular']];
const related = (a, b) => a === b || SAME.some(g => g.includes(a) && g.includes(b)) || SYN.some(x => x.includes(a) && x.includes(b));
function synonyms(r, d) {
  const pool = d === 1 ? SYN.slice(0, 12) : d === 2 ? SYN.slice(6, 24) : SYN.slice(14);
  const [w, syn, ant] = r.pick(pool), same = r() < .5;
  const fill = r.shuffle(SYN.flatMap(x => x)).filter(x => ![w, syn, ant].some(y => related(x, y)));
  const ans = same ? syn : ant;
  const c = choices(r, ans, [same ? ant : syn].concat(fill));
  return Q(`Which word means ${same ? 'the SAME as' : 'the OPPOSITE of'} '${w}'?`, c, same ? 'Try each word in a sentence in place of the first word. Does the meaning stay the same?' : 'Think what the word means, then look for the word that means the reverse.', [`"${w}" means about the same as "${syn}", and the opposite of "${ant}".`, `The question asks for the ${same ? 'same' : 'opposite'} meaning.`]);
}

// ------------------------------------------------------------ punctuation: apostrophes and contractions
const CONTR = [['do not', "don't"], ['can not', "can't"], ['will not', "won't"], ['it is', "it's"], ['they are', "they're"], ['should have', "should've"], ['we would', "we'd"], ['I am', "I'm"], ['she will', "she'll"], ['did not', "didn't"], ['they have', "they've"], ['you are', "you're"]];
const OWN = [['dog', 'bone'], ['girl', 'bike'], ['teacher', 'desk'], ['baby', 'rattle'], ['farmer', 'tractor'], ['cat', 'whiskers']];
const OWNP = [['boys', 'football'], ['girls', 'changing room'], ['players', 'shirts'], ['birds', 'nests'], ['teachers', 'staff room']];
function punctuation(r, d) {
  const kind = d === 1 ? 'contr' : d === 2 ? r.pick(['contr', 'own']) : r.pick(['ownp', 'own', 'contr']);
  if (kind === 'contr') {
    const [full, short] = r.pick(CONTR), plain = short.replace("'", '');
    const c = choices(r, short, [plain, short.replace(/(\w)'(\w)/, "$1$2'").replace(/'$/, "'"), full.replace(' ', "'"), plain.slice(0, -1) + "'" + plain.slice(-1), "'" + plain]);
    return Q(`What is the shortened form of '${full}'?`, c, 'The apostrophe goes where the missing letters were.', [`In "${short}", the apostrophe takes the place of the missing letter${full.replace(' ', '').length - plain.length > 1 ? 's' : ''}.`, full === 'will not' ? '"will not" is a special case: it becomes "won\'t".' : `So "${full}" becomes "${short}".`]);
  }
  if (kind === 'own') {
    const [who, what] = r.pick(OWN), ans = `The ${who}'s ${what} was lost.`;
    const c = choices(r, ans, [`The ${who}s ${what} was lost.`, `The ${who}s' ${what} was lost.`, `The ${who}'s' ${what} was lost.`, `The ${who} ${what}'s was lost.`]);
    return Q(`Which sentence uses the apostrophe correctly? (There is one ${who}.)`, c, 'To show that something belongs to one person or animal, add \'s.', [`The ${what} belongs to one ${who}.`, `For one owner, add 's: the ${who}'s ${what}.`]);
  }
  const [who, what] = r.pick(OWNP), ans = `The ${who}' ${what} ${what.endsWith('s') ? 'were' : 'was'} left outside.`;
  const verb = what.endsWith('s') ? 'were' : 'was';
  const c = choices(r, ans, [`The ${who}'s ${what} ${verb} left outside.`, `The ${who} ${what} ${verb} left outside.`, `The ${who.slice(0, -1)}s's ${what} ${verb} left outside.`, `The ${who}s' ${what} ${verb} left outside.`]);
  return Q(`Which sentence uses the apostrophe correctly? (There are lots of ${who}.)`, c, 'For more than one owner, when the word already ends in s, the apostrophe goes after the s.', [`There are lots of ${who}, and the word already ends in s.`, `So the apostrophe goes after the s: the ${who}' ${what}.`]);
}

window.GENCORE.register('english', { spelling, grammar, synonyms_antonyms: synonyms, punctuation }, 2);
})();
