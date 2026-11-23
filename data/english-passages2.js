/* More reading comprehension: 20 original passages (stories, non-fiction and poems), each with 9 questions:
   three "find it" questions (level 1), three "work it out" questions (level 2) and three about the writer's choices (level 3). */
(function () {
'use strict';
const E = window.BANK && window.BANK.english; if (!E) return;
const TOPIC = { story: 'comp_fiction', fact: 'comp_nonfiction', poem: 'comp_poetry' };
const HINT = ['', 'The answer is written in the text. Scan for the key word in the question.', 'The text gives clues but does not say it directly. What can you work out?', 'Think about why the writer chose those words and what picture they make.'];
const LEAD = ['', "This is a 'find it' question. Go back to the text and find the exact words.", 'This is an inference question. Find the clues in the text and work out what they show.', "This question is about the writer's choices. Read the words around the phrase and think about their effect."];
function add(id, type, title, text, qs) {
  E.passages[id] = { kind: type === 'poem' ? 'poem' : 'prose', title, text };
  qs.forEach(([d, q, opts, why], k) => {
    const right = opts[0], a = (k * 3 + id.length) % 5, list = opts.slice(1); list.splice(a, 0, right);
    E.questions.push({ id: `e-${TOPIC[type]}-${id}-${String(k + 1).padStart(2, '0')}`, topic: TOPIC[type], d, q, opts: list, a, hint: HINT[d], steps: [LEAD[d], why, `The answer is: ${right}`], p: id });
  });
}

// ------------------------------------------------------------------ stories
add('f2_kite', 'story', 'The Red Kite', `Priya had built the kite herself from garden canes, a bin bag and a ball of string that Grandad swore was older than she was. It was not beautiful. One wing drooped like a tired ear, and the tail was made of knotted sweet wrappers.

"It'll never fly," said her cousin Sam, who had a shop-bought dragon kite with gold eyes.

On the hill the wind was gusty and impatient. Sam's dragon leapt into the air, twisted twice, and dived nose-first into a gorse bush. Priya held her breath and let her kite go.

For a moment it wobbled. Then the drooping wing caught the wind, the sweet-wrapper tail began to rattle, and the red kite climbed. It climbed until it was a tiny flag against the clouds, steady as a hawk.

Sam untangled his dragon in silence. Then he came and stood beside her, squinting upwards.

"How did you get the wing like that?" he asked at last.

Priya grinned. "I didn't," she said. "That's the bit I got wrong."`, [
  [1, 'What was the tail of Priya\'s kite made from?', ['knotted sweet wrappers', 'garden canes', 'gold ribbon', 'a bin bag', 'old string'], 'The text says "the tail was made of knotted sweet wrappers".'],
  [1, 'What happened to Sam\'s dragon kite?', ['It dived into a gorse bush.', 'It flew higher than Priya\'s kite.', 'Its string snapped.', 'It was blown out to sea.', 'It tore in half.'], 'The text says it "dived nose-first into a gorse bush".'],
  [1, 'Who said the string was very old?', ['Grandad', 'Sam', 'Priya', 'Priya\'s mother', 'a shopkeeper'], '"Grandad swore was older than she was."'],
  [2, 'Why did Priya hold her breath before letting go?', ['She was nervous that her kite might not fly.', 'The wind on the hill was too cold to breathe in.', 'She was trying very hard not to laugh at Sam.', 'She was out of breath from climbing the hill.', 'She wanted to hear which way the wind was blowing.'], 'Sam had said it would never fly, and she was not sure herself.'],
  [2, 'Why does Sam untangle his kite "in silence"?', ['He feels embarrassed after his kite crashed.', 'He is angry with Priya for laughing at him.', 'He has lost his voice from shouting in the wind.', 'He is concentrating hard on the tangled string.', 'He has not noticed that Priya\'s kite is flying.'], 'He had boasted that Priya\'s kite would fail, but his own crashed.'],
  [2, 'What surprised Priya about her kite flying well?', ['The part she got wrong is what made it fly.', 'Sam secretly helped her to fix the broken wing.', 'The wind dropped just as she let the kite go.', 'It flew perfectly without needing any string.', 'Grandad had mended it for her the night before.'], 'She says the drooping wing was "the bit I got wrong", yet it caught the wind.'],
  [3, 'What does "One wing drooped like a tired ear" show?', ['The kite looked floppy and uneven.', 'The kite could hear the wind.', 'The kite was shaped like an animal.', 'The kite was very old.', 'The kite was too heavy.'], 'A tired ear hangs down, so the wing hangs down unevenly.'],
  [3, 'Why does the writer describe the wind as "impatient"?', ['To make the wind seem restless and hard to control.', 'To show that it was getting late in the afternoon.', 'To show that the wind was very soft and gentle.', 'To show that Sam was impatient to fly his kite.', 'To explain why it started to rain on the hill.'], 'Giving the wind a human feeling shows it was gusty and unsettled.'],
  [3, 'What is the main message of the story?', ['Something homemade and imperfect can still succeed.', 'Shop-bought toys are always better than homemade ones.', 'Kites should only ever be flown on very high hills.', 'Cousins never get on with each other for long.', 'It is wrong to boast about the toys you own.'], 'The odd-looking homemade kite flies best, even because of its mistake.']
]);

add('f2_flood', 'story', 'The Night of the Flood', `The rain had been falling for three days when the river finally burst its banks. Tom woke to a strange sound, a soft gurgling where there should have been silence. He swung his legs out of bed and gasped. The carpet was cold and squelching.

Downstairs, Mum was already awake, torch in hand, her face pale in its beam. Water was seeping under the front door in a thin brown sheet.

"Upstairs," she said calmly. "Take whatever you can carry."

Tom grabbed the photo albums from the bottom shelf, then the cat's basket. Biscuit the cat was nowhere to be seen. Tom's heart thumped. He searched the kitchen, the hall, the cupboard under the stairs, calling her name over and over.

At last he heard a small, offended miaow from above. Biscuit was sitting on top of the tall bookcase, her tail wrapped neatly round her paws, looking down at the water as if it were a personal insult.

Tom laughed for the first time that night. "Clever girl," he said. "You knew before any of us."`, [
  [1, 'How long had it been raining?', ['three days', 'one night', 'a week', 'two days', 'all summer'], '"The rain had been falling for three days".'],
  [1, 'What did Tom carry upstairs first?', ['the photo albums', 'the cat\'s basket', 'a torch', 'his schoolbag', 'the carpet'], '"Tom grabbed the photo albums from the bottom shelf, then the cat\'s basket."'],
  [1, 'Where was Biscuit hiding?', ['on top of the tall bookcase', 'in the cupboard under the stairs', 'in the kitchen', 'under Tom\'s bed', 'in her basket'], 'Biscuit "was sitting on top of the tall bookcase".'],
  [2, 'How did Mum feel, judging by her face and voice?', ['worried but trying to stay calm', 'excited and full of energy', 'angry with Tom for waking her', 'bored and wanting to sleep', 'cheerful and laughing'], 'Her face was pale, but she spoke "calmly".'],
  [2, 'Why did Tom take the photo albums first?', ['They were precious and could not be replaced.', 'They were the heaviest things in the room.', 'Mum had told him to fetch them first of all.', 'They were already soaking wet from the flood.', 'He wanted something to read while he waited.'], 'Photos are irreplaceable memories, so he saved them first.'],
  [2, 'What does Tom mean by "You knew before any of us"?', ['The cat sensed the danger and climbed up early.', 'The cat had turned on the torch for them.', 'The cat had woken Mum up by miaowing loudly.', 'The cat had heard about the flood on the radio.', 'The cat had been out in the rain all night.'], 'Biscuit was already high up and dry when the family discovered the water.'],
  [3, 'Why does the writer use the word "squelching"?', ['It helps you hear and feel the wet carpet.', 'It shows that the carpet was brand new.', 'It shows that Tom was still dreaming.', 'It shows that the carpet was warm and dry.', 'It is the name of the river that flooded.'], 'The sound of the word copies the noise of wet ground underfoot.'],
  [3, 'What effect does "as if it were a personal insult" have?', ['It makes the cat seem funny and proud.', 'It shows the cat is frightened.', 'It shows the cat is injured.', 'It shows the water is dangerous.', 'It shows Tom is angry with the cat.'], 'It gives the cat a grumpy human attitude, which is funny after a tense search.'],
  [3, 'How does the mood change at the end of the story?', ['It changes from tense to relieved and light-hearted.', 'It changes from happy and cheerful to sad.', 'It stays frightening all the way to the end.', 'It changes from calm and quiet to angry.', 'It changes from funny to very serious.'], 'Tom laughs "for the first time that night" when he finds the cat safe.']
]);

add('f2_gate', 'story', 'The Green Gate', `Every day on the way to school, Leo passed the green gate. It was set into a high brick wall, and it was always locked. Ivy crawled over the top, and through a gap at the bottom you could see a strip of grass and, sometimes, the flicker of something moving.

"It's just a garden," said his friend Ada, who had no imagination.

But one wet Tuesday the gate was open. Not wide open, just a crack, as if someone had forgotten to pull it shut. Leo stopped. He looked up and down the empty street. Then he pushed.

The hinges groaned like an old man getting out of a chair. Inside was a garden, Ada was right about that. But it was a garden that had been left to do as it pleased. Roses had climbed the apple trees. A stone fountain was full of frogs. And in the middle of the lawn, on a wooden bench, sat a very small, very old woman, feeding a robin from her hand.

She looked up, not surprised at all.

"You took your time," she said. "I've been leaving it open for a week."`, [
  [1, 'What colour was the gate?', ['green', 'red', 'brown', 'black', 'white'], 'The title and first line call it "the green gate".'],
  [1, 'On what day was the gate open?', ['Tuesday', 'Monday', 'Saturday', 'Friday', 'Sunday'], '"one wet Tuesday the gate was open".'],
  [1, 'What was the old woman feeding?', ['a robin', 'the frogs', 'a cat', 'some ducks', 'a squirrel'], 'She was "feeding a robin from her hand".'],
  [2, 'Why did Leo look up and down the street before pushing the gate?', ['He wanted to check that nobody was watching.', 'He was waiting for Ada to catch him up.', 'He was looking out for the school bus.', 'He had lost his way and needed directions.', 'He heard a car coming round the corner.'], 'He knew he was going somewhere he probably should not, so he checked he was alone.'],
  [2, 'What does the old woman\'s last line suggest?', ['She had been hoping Leo would come in.', 'She was angry that Leo was late for school.', 'She did not know Leo was there.', 'She wanted him to leave.', 'She had forgotten to shut the gate.'], 'She left it open on purpose "for a week", waiting for him.'],
  [2, 'What does Leo think of Ada?', ['He thinks she has no imagination.', 'He thinks she is very brave and bold.', 'He thinks she is unkind to other children.', 'He thinks she is the cleverest in the class.', 'He thinks she is too lazy to walk to school.'], 'The text says Ada "had no imagination".'],
  [3, 'Why does the writer compare the hinges to "an old man getting out of a chair"?', ['To show they were stiff and creaky from not being used.', 'To show that a very old man lived in the garden.', 'To show that the gate had just been put up.', 'To make the gate sound frightening and dangerous.', 'To show that the gate was made of old wood.'], 'An old man getting up groans slowly, like rusty hinges.'],
  [3, 'What does "a garden that had been left to do as it pleased" mean?', ['The garden had grown wild without much tidying.', 'The garden was kept very neat and tidy.', 'The plants in the garden could really talk.', 'The garden had recently been sold to a builder.', 'The garden was empty, with nothing growing.'], 'Roses climbing trees and frogs in the fountain show nature taking over.'],
  [3, 'How does the writer build up curiosity at the start?', ['By describing a locked gate with something moving behind it.', 'By telling us exactly what is inside the garden.', 'By starting the story with a long conversation.', 'By describing a busy street full of people.', 'By telling us how the story ends at the start.'], 'The locked gate and "the flicker of something moving" make us want to know more.']
]);

add('f2_bake', 'story', 'The Bake-Off', `Freya had exactly one hour to bake a cake for the school competition, and everything was going wrong.

First the eggs. She cracked the first one perfectly, then the second exploded in her hand and dripped down her elbow. Then the flour bag split, and a white cloud settled over the kitchen like snow. Her little brother Max, who was supposed to be helping, sneezed so hard he fell off his stool.

"Don't panic," Freya told herself, which is what people always say when they are panicking.

She wiped the counter, measured everything again, and slid the tin into the oven. For thirty-five minutes she watched it through the glass like a nervous cat watching a mouse hole.

The cake rose. Then, as she opened the door, it sank in the middle with a sad little sigh.

Freya stared at it. Max stared at it. Then Max said, "We could fill the hole with strawberries."

They did. They piled the strawberries high and dusted the top with icing sugar. At the competition the judge took one bite and closed her eyes.

"A volcano cake," she said. "How original."`, [
  [1, 'How long did Freya have to bake the cake?', ['one hour', 'thirty-five minutes', 'half an hour', 'two hours', 'all day'], '"Freya had exactly one hour".'],
  [1, 'Who suggested using strawberries?', ['Max', 'Freya', 'the judge', 'Freya\'s mum', 'a teacher'], '"Then Max said, \'We could fill the hole with strawberries.\'"'],
  [1, 'What did they dust on top of the cake?', ['icing sugar', 'flour', 'chocolate', 'cinnamon', 'sprinkles'], '"dusted the top with icing sugar".'],
  [2, 'Why did Max fall off his stool?', ['He sneezed because of the flour cloud.', 'Freya pushed him off by accident.', 'The leg of his stool was broken.', 'He was laughing too hard at the eggs.', 'He was trying to reach the oven door.'], 'The flour bag split and then he "sneezed so hard he fell off his stool".'],
  [2, 'What does "which is what people always say when they are panicking" tell us about Freya?', ['She was actually panicking.', 'She was completely calm.', 'She was angry with Max.', 'She was bored.', 'She was pleased with the cake.'], 'People tell themselves not to panic when they already are.'],
  [2, 'What did the judge think of the cake?', ['She liked it and thought it was creative.', 'She thought it was a complete disaster.', 'She refused to taste it after one look.', 'She thought it was far too sweet to eat.', 'She thought Max had made it on his own.'], 'She closed her eyes after tasting it and called it "original".'],
  [3, 'Why does the writer compare the flour to snow?', ['To help us picture a white layer covering everything.', 'To show it was very cold in the kitchen.', 'To show it was winter.', 'To show the flour was wet.', 'To show the flour was falling slowly from the sky.'], 'Snow covers everything in white, just like the spilled flour.'],
  [3, 'What does "with a sad little sigh" do?', ['It makes the sinking cake seem like a disappointed person.', 'It shows that Freya had started to cry.', 'It describes the sound of the oven door closing.', 'It shows that the cake was burnt on top.', 'It shows that the judge did not like the cake.'], 'Giving the cake a human sigh makes its sinking feel funny and disappointing.'],
  [3, 'What is the main idea of the story?', ['A mistake can be turned into something good.', 'Baking is far too difficult for children.', 'Little brothers are always unhelpful in kitchens.', 'You should never enter a baking competition.', 'Strawberries are the best fruit for any cake.'], 'The sunken cake becomes a prize-worthy "volcano cake".']
]);

add('f2_signal', 'story', 'No Signal', `The coach broke down halfway up the mountain, in a place where the road was narrow and the phones had no signal at all.

Mr Okafor stood in the aisle and clapped his hands. "Right, Year Six. Nobody panics. The driver is walking to the farm we passed. It's about two miles. Until help comes, we stay together."

For the first ten minutes everyone complained. Then Zainab found an old pack of cards in the luggage rack, and soon half the coach was playing snap. Jordan, who never talked in class, turned out to know a hundred jokes, each one worse than the last. Even Mr Okafor laughed at the one about the penguin and the fridge.

Outside, the clouds lifted. Below them the whole valley appeared, green and gold, with a silver thread of river running through it. Someone said, "Wow," and for a moment nobody spoke at all.

When the tractor finally arrived to tow them, there was a groan of disappointment.

"I think," said Mr Okafor, "that might be the best trip we've ever had, and we never even got there."`, [
  [1, 'Where did the coach break down?', ['halfway up a mountain', 'at the farm', 'next to the river', 'at the school gates', 'on a motorway'], '"The coach broke down halfway up the mountain".'],
  [1, 'What did Zainab find?', ['an old pack of cards', 'a map', 'a torch', 'a joke book', 'a phone with signal'], '"Zainab found an old pack of cards in the luggage rack".'],
  [1, 'What came to tow the coach?', ['a tractor', 'a lorry', 'another coach', 'a police car', 'a helicopter'], '"When the tractor finally arrived to tow them".'],
  [2, 'Why did the driver walk to the farm?', ['There was no phone signal, so he had to fetch help.', 'He was hungry and wanted to buy some food.', 'He lived at the farm and wanted to go home.', 'He was lost and wanted to ask for directions.', 'Mr Okafor had told him off for driving badly.'], 'The phones "had no signal at all", so walking was the only way to get help.'],
  [2, 'What do we learn about Jordan?', ['He is usually quiet but turns out to be funny.', 'He is always telling jokes during lessons.', 'He is the driver of the broken-down coach.', 'He is frightened of penguins and fridges.', 'He is the one who found the pack of cards.'], 'He "never talked in class" but knew "a hundred jokes".'],
  [2, 'Why was there "a groan of disappointment" when help arrived?', ['The children were enjoying themselves and did not want it to end.', 'The tractor was too small to tow the coach.', 'They were very hungry and wanted their lunch.', 'It had just started to rain again outside.', 'They had all lost the game of snap.'], 'They had been having fun and admiring the view, so they were sad to leave.'],
  [3, 'What does "a silver thread of river" describe?', ['A thin, shining river seen from far above.', 'A river made of real silver metal.', 'A river that is full of silver fish.', 'A wide, slow river full of mud.', 'A river that has completely dried up.'], 'From high up, the river looks thin and shiny like a silver thread.'],
  [3, 'Why does the writer say "each one worse than the last"?', ['To show in a funny way that the jokes were silly.', 'To show that Jordan was being unkind to others.', 'To show that the jokes were far too long.', 'To show that nobody could hear the jokes.', 'To show that the jokes were rude and upsetting.'], 'The jokes were so bad they were funny, which is why people laughed.'],
  [3, 'What is the main message of the story?', ['Good times can come from unexpected problems.', 'Coach trips are always long and boring.', 'You should always carry a phone with you.', 'Teachers do not enjoy going on school trips.', 'Mountains are too dangerous to visit.'], 'Mr Okafor calls it the best trip ever, even though they never arrived.']
]);

add('f2_robot', 'story', 'Unit Seven', `Unit Seven was the oldest robot in the recycling centre. Its paint had peeled to a dull grey, one wheel squeaked, and its voice box crackled whenever it spoke. The newer robots were sleek and silver and finished their sorting by noon.

"You are slow," they told Unit Seven. "You will be switched off soon."

Unit Seven did not argue. It simply carried on, lifting each piece of rubbish, turning it over, and placing it carefully in the right bin. Sometimes it paused. A cracked teacup. A child's drawing of a dog. A watch that had stopped at ten past four.

One morning a girl came running into the centre, her eyes red from crying. "My grandad's medal," she sobbed. "It was in his coat pocket. We threw the coat away by mistake."

The silver robots shook their heads. "Everything from Tuesday has been crushed," they said.

Unit Seven rolled forward, squeaking. From a small box under its arm it took out a round bronze medal on a faded ribbon.

"I keep the things," it crackled softly, "that someone might come back for."`, [
  [1, 'What colour was Unit Seven\'s paint?', ['dull grey', 'shiny silver', 'bright red', 'bronze', 'white'], '"Its paint had peeled to a dull grey".'],
  [1, 'What time had the watch stopped at?', ['ten past four', 'noon', 'half past seven', 'ten to four', 'midnight'], '"A watch that had stopped at ten past four."'],
  [1, 'What had the girl lost?', ['her grandad\'s medal', 'a teacup', 'a watch', 'her drawing', 'her coat'], '"My grandad\'s medal," she sobbed.'],
  [2, 'Why was Unit Seven slower than the other robots?', ['It looked carefully at each thing before sorting it.', 'Its battery was nearly flat all the time.', 'It did not know which bin to use for things.', 'It was lazy and did not want to work.', 'It was switched off for most of the day.'], 'It turned each item over and sometimes paused to look at it.'],
  [2, 'Why did Unit Seven keep certain objects?', ['It thought people might want them back one day.', 'It wanted to sell them in the shop next door.', 'The silver robots had told it to keep them.', 'It was collecting rubbish just for fun.', 'It did not know which bins they belonged in.'], 'It says it keeps things "that someone might come back for".'],
  [2, 'How might the silver robots feel at the end?', ['surprised and perhaps a little ashamed', 'proud of how fast they had worked', 'angry with the girl for crying', 'pleased to be faster than Unit Seven', 'bored and wanting to finish early'], 'They had called Unit Seven slow, but its care saved the medal.'],
  [3, 'What do the objects "A cracked teacup. A child\'s drawing of a dog." have in common?', ['They are ordinary things that might matter to someone.', 'They are all very valuable and could be sold.', 'They are all made of metal and can be recycled.', 'They all belong to the girl and her grandad.', 'They are all broken toys that nobody wants.'], 'Each item might hold a memory, which is why Unit Seven pauses.'],
  [3, 'Why does the writer use short sentences for the list of objects?', ['To make each object stand out, as if we pause with the robot.', 'To make the story move along much faster.', 'Because the robot cannot say long sentences.', 'To show that all the objects were very small.', 'To fill up space at the end of a paragraph.'], 'Short sentences slow the reader down, just as Unit Seven pauses.'],
  [3, 'Which word best describes Unit Seven?', ['thoughtful', 'boastful', 'careless', 'impatient', 'unfriendly'], 'It handles things carefully and thinks about the people they belong to.']
]);

add('f2_swim', 'story', 'The Last Length', `The pool smelled of chlorine and nerves. Maya stood on the starting block, toes curled over the edge, and tried not to look at the girl in the next lane, who was tall and calm and had already won two races.

The whistle went. Maya dived.

The first length was easy. The second was fine. By the third her arms felt like wet sandbags and her chest was on fire. She could hear the crowd only as a blurred roar, as if she were listening from inside a shell.

At the final turn she glanced sideways. The tall girl was a full body length ahead.

Something in Maya's head said, simply, *keep going*. Not *win*. Not *catch her*. Just *keep going*. So she did. One stroke, then another. Breathe. Another.

She touched the wall and came up gasping. The board said she had finished second. But next to her name, in small green letters, were two words she had never seen there before: PERSONAL BEST.

Her coach was jumping up and down on the side of the pool like a boy who had just won the cup final.`, [
  [1, 'How many races had the tall girl already won?', ['two', 'one', 'three', 'none', 'four'], 'She "had already won two races".'],
  [1, 'Where did Maya finish?', ['second', 'first', 'third', 'last', 'fourth'], '"The board said she had finished second."'],
  [1, 'What colour were the letters next to her name?', ['green', 'red', 'gold', 'blue', 'white'], '"in small green letters".'],
  [2, 'Why did Maya try not to look at the girl in the next lane?', ['She felt nervous about racing someone so good.', 'She did not like the girl in the next lane.', 'She was looking around for her coach.', 'The girl in the next lane was splashing her.', 'She had something stuck in her eye.'], 'The girl was tall, calm and a winner, which made Maya nervous.'],
  [2, 'Why was the coach so excited?', ['Maya had swum faster than ever before.', 'Maya had won the race.', 'The tall girl had been disqualified.', 'Maya had broken the pool record.', 'The race was cancelled.'], 'She got a "personal best", her fastest time ever.'],
  [2, 'What helped Maya on the last length?', ['Focusing just on keeping going, one stroke at a time.', 'Hearing her coach shout instructions from the side.', 'Seeing that she was overtaking the tall girl.', 'Stopping for a short rest at the final turn.', 'Thinking about winning a gold medal.'], 'She told herself "keep going", not "win".'],
  [3, 'What does "smelled of chlorine and nerves" suggest?', ['The air was full of the swimmers\' worry as well as the pool smell.', 'The water in the pool was dirty and needed changing.', 'Nerves have a strong smell that everyone can notice.', 'The pool had just been cleaned with strong soap.', 'Maya disliked swimming and the smell of the pool.'], 'Nerves cannot really be smelled; the writer shows how tense the atmosphere was.'],
  [3, 'Why does the writer compare Maya\'s arms to "wet sandbags"?', ['To show they felt very heavy and tired.', 'To show that they were covered in sand.', 'To show that they were strong and powerful.', 'To show that the water was very cold.', 'To show that she had hurt them badly.'], 'Wet sandbags are very heavy, like tired muscles.'],
  [3, 'What does the final sentence show about the coach?', ['He was overjoyed for Maya, as if she had won.', 'He was disappointed that she came second.', 'He was only a young boy, not a grown-up.', 'He was cold and jumping to keep warm.', 'He was angry with the judges\' decision.'], 'Jumping "like a boy who had just won the cup final" shows huge joy.']
]);

add('f2_letter', 'story', 'The Letter in the Wall', `When the builders knocked down the old fireplace in Grace's bedroom, they found a letter. It was tucked into a gap between the bricks, yellow and brittle, tied with a thread of blue wool.

"Don't open it," said Dad. "It might fall to pieces."

But Grace had already seen the name on the front: *To whoever finds this*.

They opened it at the kitchen table, slowly, with tweezers. The handwriting was round and careful, the kind children are taught at school.

*My name is Edith and I am ten. It is 1953 and today the Queen is being crowned. Everyone is watching on Mr Pike's television because he is the only one in the street who has one. I am meant to be there too but I have hidden this first. I want someone in the future to know I was here. I hope there are flying cars where you are. Please write back.*

Grace read it three times. Then she fetched a pen and a clean sheet of paper.

"What are you doing?" asked Dad.

"Writing back," said Grace. "And when they put the new fireplace in, it's going in the same gap."`, [
  [1, 'Where was the letter found?', ['in a gap between the bricks of the old fireplace', 'under the floorboards', 'in the attic', 'in a drawer', 'in the garden'], 'It "was tucked into a gap between the bricks".'],
  [1, 'How old was Edith?', ['ten', 'nine', 'eleven', 'twelve', 'eight'], '"My name is Edith and I am ten."'],
  [1, 'What was the letter tied with?', ['a thread of blue wool', 'a red ribbon', 'string', 'an elastic band', 'nothing'], '"tied with a thread of blue wool".'],
  [2, 'Why did they open the letter with tweezers?', ['It was old and fragile, so they had to be very careful.', 'It was covered in thick black soot from the fireplace.', 'Dad did not want to leave any fingerprints on it.', 'The writing was too tiny to read without them.', 'It was still hot from the fire in the grate.'], 'It was "yellow and brittle" and Dad said it might fall to pieces.'],
  [2, 'Why was everyone at Mr Pike\'s house?', ['He had the only television, and they wanted to watch the coronation.', 'He was holding a birthday party for the whole street.', 'He had invited everyone round for a special tea.', 'There was a big street party going on in his garden.', 'He had won a prize and wanted to share it.'], 'He was "the only one in the street who has one".'],
  [2, 'What does Grace plan to do at the end?', ['Hide her own letter in the same place for the future.', 'Post her reply to Edith at the address on the letter.', 'Give both letters to the museum in town to look after.', 'Read the letter out loud to her class at school.', 'Frame the letter and hang it above the new fireplace.'], 'She writes back and says it is "going in the same gap".'],
  [3, 'Why does the writer describe the letter as "yellow and brittle"?', ['To show it is very old and could easily break.', 'To show it was written in yellow pen.', 'To show it had been burnt in a fire.', 'To show it had got wet in the rain.', 'To show it was brand new and shiny.'], 'Old paper turns yellow and becomes brittle.'],
  [3, 'What does "I hope there are flying cars where you are" tell us about Edith?', ['She was imaginative and excited about the future.', 'She was frightened of cars.', 'She knew exactly what the future would be like.', 'She did not like the present.', 'She was an inventor.'], 'She imagines an exciting future, as a ten-year-old might.'],
  [3, 'Why is the story written partly in Edith\'s own words?', ['So that we hear her voice directly from the past.', 'Because Grace was not able to read the old handwriting.', 'So that the story would be shorter and quicker to read.', 'Because Edith is still alive and wanted it printed.', 'To show that Dad was the one who wrote the letter.'], 'Reading her actual words makes Edith feel real and close.']
]);

// ------------------------------------------------------------------ non-fiction
add('n2_bees', 'fact', 'Busy Bees', `A single honeybee colony can contain up to 60,000 bees, but only one of them is the queen. She is larger than the others and lays up to 2,000 eggs a day during the summer.

Most of the bees in a hive are worker bees, which are all female. They have many different jobs, and these change as they grow older. Young workers clean the cells of the hive and feed the larvae. Later they build wax comb and guard the entrance. In the last weeks of their lives they become foragers, flying up to five kilometres to collect nectar and pollen from flowers.

When a forager finds a good patch of flowers, it returns to the hive and performs a "waggle dance". The direction of the dance shows the other bees which way to fly, and the length of the waggle tells them how far away the flowers are.

Bees are vital to farming. As they move from flower to flower, they carry pollen, which helps plants to make fruit and seeds. About a third of the food we eat depends on pollinators such as bees. Sadly, bee numbers have fallen in many countries because of disease, loss of wild flowers and the use of some pesticides.`, [
  [1, 'How many eggs can a queen lay in a day?', ['up to 2,000', 'up to 60,000', 'about 200', 'up to 5,000', 'one'], '"lays up to 2,000 eggs a day".'],
  [1, 'What is the last job a worker bee does?', ['foraging for nectar and pollen', 'cleaning cells', 'guarding the entrance', 'feeding larvae', 'building comb'], '"In the last weeks of their lives they become foragers".'],
  [1, 'What does the length of the waggle show?', ['how far away the flowers are', 'which way to fly', 'what colour the flowers are', 'how many bees should go', 'how old the bee is'], '"the length of the waggle tells them how far away the flowers are".'],
  [2, 'Why do worker bees change jobs as they get older?', ['Different jobs suit bees at different stages of life.', 'They get bored and like to try something new each day.', 'The queen chooses a new job for every bee at random.', 'Bees that make mistakes are moved to a harder job.', 'They forget how to do their old jobs as they get older.'], 'The text shows a set order: inside jobs first, flying jobs last.'],
  [2, 'Why is the waggle dance useful to the colony?', ['It helps other bees find food quickly.', 'It keeps the hive warm on cold nights.', 'It scares wasps away from the honey.', 'It tells the queen that it is time to sleep.', 'It shows the other bees which bee is the oldest.'], 'It tells other bees the direction and distance of good flowers.'],
  [2, 'Which of these is a reason given for bee numbers falling?', ['loss of wild flowers', 'too many beekeepers', 'cold summers', 'too much honey', 'bees flying too far'], 'The text lists disease, loss of wild flowers and pesticides.'],
  [3, 'Why does the writer include numbers such as 60,000 and 2,000?', ['To show the reader how large and busy a colony is.', 'To help the reader practise reading large numbers.', 'To prove that bees can count as well as people.', 'To compare the size of a bee colony with an ant nest.', 'To show that the facts in the passage are made up.'], 'Big numbers impress the reader with the scale of a colony.'],
  [3, 'What is the purpose of the final paragraph?', ['To explain why bees matter and why they are in trouble.', 'To describe, step by step, how bees make honey.', 'To tell the story of one bee\'s life from start to end.', 'To explain how farmers should build a beehive.', 'To persuade the reader to eat more honey every day.'], 'It explains pollination and the dangers bees face.'],
  [3, 'What is the effect of the word "Sadly" in the last paragraph?', ['It shows the writer is concerned about what is happening to bees.', 'It shows that bees themselves feel sad and lonely.', 'It shows that the writer is not interested in bees.', 'It tells the reader that the passage is about to end.', 'It shows that bees are dangerous to farmers\' crops.'], 'It tells us the writer\'s feeling about the falling numbers.']
]);

add('n2_ships', 'fact', 'The Unsinkable Ship', `In April 1912, the largest ship in the world set out on her first voyage from Southampton to New York. RMS Titanic was nearly 270 metres long and carried more than 2,200 people. Some of her passengers were among the richest people in the world; others were families hoping to start a new life in America.

Titanic was thought to be extremely safe. She had sixteen watertight compartments, and many people believed she could not sink. Perhaps because of this, she carried lifeboats for only about half of the people on board.

Just before midnight on 14 April, lookouts spotted an iceberg directly ahead. The crew tried to turn the ship, but it was too late. The iceberg scraped along the side, opening up several compartments to the sea. In less than three hours, Titanic had sunk.

More than 1,500 people lost their lives. The disaster shocked the world and led to important changes. New laws said that every ship must carry enough lifeboats for everyone on board, and that ships must keep a radio watch day and night. An International Ice Patrol was set up to warn ships about icebergs, and it still operates today.`, [
  [1, 'Where did Titanic\'s first voyage begin?', ['Southampton', 'New York', 'Liverpool', 'Belfast', 'London'], '"from Southampton to New York".'],
  [1, 'How many watertight compartments did Titanic have?', ['sixteen', 'six', 'twelve', 'twenty', 'four'], '"She had sixteen watertight compartments".'],
  [1, 'How long did it take Titanic to sink?', ['less than three hours', 'about ten minutes', 'a whole day', 'more than five hours', 'one hour exactly'], '"In less than three hours, Titanic had sunk."'],
  [2, 'Why might Titanic have carried so few lifeboats?', ['People believed she could not sink, so lifeboats seemed less important.', 'There was no space left on deck for any more lifeboats.', 'Lifeboats had not yet been invented in the year 1912.', 'The captain thought lifeboats made the ship look ugly.', 'The passengers had asked for fewer lifeboats on board.'], 'The text links the small number of lifeboats with the belief that she was unsinkable.'],
  [2, 'Why was turning the ship "too late"?', ['The iceberg was spotted when it was already very close.', 'The ship\'s steering wheel had broken earlier that day.', 'The crew were all asleep when the iceberg appeared.', 'The sea was far too rough for the ship to turn.', 'The iceberg was drifting towards the ship very fast.'], 'It was spotted "directly ahead" just before the crash.'],
  [2, 'Which change happened because of the disaster?', ['Ships had to carry enough lifeboats for everyone.', 'Ships were no longer allowed to cross the Atlantic.', 'Ships had to be smaller.', 'Icebergs were destroyed.', 'Ships could only sail in summer.'], 'New laws required enough lifeboats for everyone on board.'],
  [3, 'Why does the writer mention both rich passengers and families starting a new life?', ['To show that people from all walks of life were on board.', 'To show that only the rich passengers were in danger.', 'To make the reader feel jealous of the rich passengers.', 'To explain how the tickets for the ship were sold.', 'To show that America was richer than Britain in 1912.'], 'It shows the disaster affected all kinds of people.'],
  [3, 'Why is the passage called "The Unsinkable Ship"?', ['It points out the sad irony that a ship thought unsinkable sank.', 'Because the ship was so strong that it never sank at all.', 'Because the ship was built from rubber, so it floated.', 'Because it was the fastest ship that had ever sailed.', 'Because the ship could travel under the water.'], 'The title reflects what people believed, which turned out to be wrong.'],
  [3, 'How is the passage mainly organised?', ['In time order, from the voyage to the changes afterwards.', 'As a list of questions about the ship, with answers.', 'As a diary written by a passenger during the voyage.', 'As an argument for and against building large ships.', 'In order of importance, starting with the new laws.'], 'It moves from the start of the voyage, to the crash, to what happened after.']
]);

add('n2_sleep', 'fact', 'Why We Need Sleep', `Children aged between six and twelve need around nine to twelve hours of sleep every night. That might sound like a lot, but sleep is not wasted time. While you are asleep, your body and brain are hard at work.

During deep sleep, your body repairs muscles and releases a hormone that helps you grow. Your immune system, which fights off illness, also becomes stronger. This is one reason why people who are short of sleep often catch more colds.

Meanwhile, your brain is busy sorting through everything that happened during the day. It decides which memories to keep and files them away, rather like a librarian putting books back on the shelves. Scientists have found that pupils who sleep well after learning something new remember it better the next day.

Not getting enough sleep can make it hard to concentrate, and it can make people grumpy and clumsy. To sleep well, experts suggest going to bed at the same time each night, keeping the bedroom dark and cool, and switching off screens at least an hour before bed. The blue light from phones and tablets can trick the brain into thinking it is still daytime.`, [
  [1, 'How much sleep do children aged six to twelve need?', ['around nine to twelve hours', 'around six hours', 'exactly eight hours', 'about fifteen hours', 'as little as possible'], '"around nine to twelve hours of sleep every night".'],
  [1, 'What does the immune system do?', ['fights off illness', 'repairs muscles', 'sorts memories', 'makes you grow', 'keeps you warm'], '"Your immune system, which fights off illness".'],
  [1, 'How long before bed should screens be switched off?', ['at least an hour', 'ten minutes', 'three hours', 'half an hour', 'just as you get into bed'], '"switching off screens at least an hour before bed".'],
  [2, 'Why might a pupil who sleeps badly do worse in a test?', ['Their brain has had less time to store what they learned.', 'They will feel too warm to think properly in the test.', 'Their body will have grown too much during the night.', 'They will catch a cold halfway through the test.', 'Their muscles will ache too much to hold a pencil.'], 'Sleep helps the brain keep memories, so poor sleep means remembering less.'],
  [2, 'Why does the writer say "sleep is not wasted time"?', ['Because the body and brain do important work during sleep.', 'Because you can finish your homework while you sleep.', 'Because sleeping is the most enjoyable part of the day.', 'Because time seems to pass more quickly at night.', 'Because doctors say that children must stay in bed.'], 'The next paragraphs explain the work done during sleep.'],
  [2, 'Why should a bedroom be kept dark?', ['Darkness tells the brain it is night-time and time to sleep.', 'Light makes a bedroom much too cold to sleep in.', 'It stops you from staying up late to read a book.', 'It saves money on the electricity bill each month.', 'It stops you seeing frightening shadows on the wall.'], 'The text says light can trick the brain into thinking it is daytime.'],
  [3, 'Why does the writer compare the brain to "a librarian putting books back on the shelves"?', ['To explain in a simple way how the brain sorts and stores memories.', 'To show that the brain is very old and full of dust.', 'To suggest that children should read books before bed.', 'To show that the brain is quiet, like a library.', 'To show that libraries are important places to visit.'], 'A librarian sorts and files books, just as the brain files memories.'],
  [3, 'What is the purpose of the last paragraph?', ['To give practical advice about sleeping well.', 'To tell a story about a child who could not sleep.', 'To explain how dreams work.', 'To describe what happens in deep sleep.', 'To argue that screens should be banned.'], 'It lists tips: same bedtime, dark cool room, no screens.'],
  [3, 'Which word best describes the tone of the passage?', ['informative', 'frightening', 'angry', 'humorous', 'sad'], 'It mainly explains facts and gives advice.']
]);

add('n2_river', 'fact', 'The Journey of a River', `Every river begins somewhere high up, often as a small spring bubbling out of a hillside or as melting snow on a mountain. This starting point is called the source.

In its upper course, near the source, the river is narrow and shallow, but it flows fast because the land is steep. The water carries stones and pebbles along with it, wearing away the riverbed and cutting a steep-sided V-shaped valley. Waterfalls are common here, where the river flows over a band of hard rock.

As the river reaches lower land, in its middle course, it becomes wider and deeper. Smaller streams called tributaries join it, adding more water. The river begins to swing from side to side in large bends called meanders.

In its lower course, the land is almost flat. The river moves slowly and drops the mud and sand it has been carrying. This creates wide, flat areas called floodplains, which are often very good for farming. Finally, the river reaches its mouth, where it flows into a lake or the sea. Some rivers split into many smaller channels before they reach the sea, forming a fan-shaped area of land called a delta.`, [
  [1, 'What is the starting point of a river called?', ['the source', 'the mouth', 'the delta', 'the meander', 'the floodplain'], '"This starting point is called the source."'],
  [1, 'What are tributaries?', ['smaller streams that join the river', 'large bends in a river', 'waterfalls', 'flat areas of land', 'channels near the sea'], '"Smaller streams called tributaries join it".'],
  [1, 'What shape of valley does the river cut in its upper course?', ['V-shaped', 'U-shaped', 'flat', 'fan-shaped', 'round'], '"cutting a steep-sided V-shaped valley".'],
  [2, 'Why does a river flow fast in its upper course?', ['Because the land there is steep.', 'Because the river is wide.', 'Because there are many tributaries.', 'Because the sea pulls it.', 'Because it carries mud.'], '"it flows fast because the land is steep".'],
  [2, 'Why are floodplains good for farming?', ['The river leaves rich mud and sand there.', 'They are high up and safe from floods.', 'They have many waterfalls to water crops.', 'They stay dry all through the year.', 'They are steep, so rain drains away.'], 'The river "drops the mud and sand", which makes fertile land.'],
  [2, 'Why does the river become wider in its middle course?', ['Tributaries add more water to it.', 'The source dries up in summer.', 'The land becomes much steeper.', 'It is getting close to the sea.', 'It flows over a band of hard rock.'], 'Tributaries join it, "adding more water".'],
  [3, 'How is the passage organised?', ['It follows the river from source to mouth.', 'It is a list of famous rivers.', 'It is written as a story about a boat.', 'It compares rivers in different countries.', 'It starts at the sea and works upwards.'], 'Each paragraph describes the next stage: upper, middle, then lower course.'],
  [3, 'Why are some words such as "meanders" and "delta" explained in the passage?', ['They are technical terms the reader may not know.', 'They are spelled wrongly in most dictionaries.', 'They are the names of real rivers in Britain.', 'They are words that the writer made up.', 'They are the most common words in English.'], 'The writer explains geography words for a young reader.'],
  [3, 'What does "swing from side to side" help the reader picture?', ['The river curving back and forth across the land.', 'Children playing on swings beside the river.', 'The river suddenly flowing backwards uphill.', 'The river dropping over a tall waterfall.', 'The river freezing solid in the winter cold.'], 'It creates a picture of the bending path of a meander.']
]);

add('n2_mars', 'fact', 'A Visit to Mars?', `Mars is the fourth planet from the Sun and our second-closest neighbour in space. It is often called the Red Planet, because its surface is covered in dust containing iron oxide, the same chemical that gives rust its reddish colour.

Mars is about half the width of Earth. A day there lasts slightly longer than ours, at 24 hours and 37 minutes, but a year is almost twice as long, because Mars takes 687 Earth days to travel round the Sun.

It would not be an easy place to live. The air is very thin and mostly carbon dioxide, so humans could not breathe it. Temperatures can drop to minus 125 degrees Celsius at the poles. Huge dust storms sometimes cover the whole planet for weeks.

Even so, Mars has fascinated scientists for centuries. It is home to the tallest volcano in the solar system, Olympus Mons, which is about three times the height of Mount Everest. Robot rovers have found evidence that rivers and lakes once flowed across its surface, which makes scientists wonder whether tiny living things might once have existed there. Several space agencies hope to send astronauts to Mars within the next few decades.`, [
  [1, 'Why is Mars called the Red Planet?', ['Its dust contains iron oxide, which is reddish.', 'It is the hottest planet in the solar system.', 'Its surface is covered in red-leaved plants.', 'It is the closest planet of all to the Sun.', 'It is surrounded by thick clouds of red gas.'], 'Its surface is covered in dust containing iron oxide, like rust.'],
  [1, 'How long is a day on Mars?', ['24 hours and 37 minutes', '687 days', '12 hours', 'exactly 24 hours', '37 hours'], '"A day there lasts slightly longer than ours, at 24 hours and 37 minutes".'],
  [1, 'What is Olympus Mons?', ['the tallest volcano in the solar system', 'a robot rover', 'a dust storm', 'a lake on Mars', 'a space agency'], '"the tallest volcano in the solar system, Olympus Mons".'],
  [2, 'Why could humans not breathe on Mars?', ['The air is thin and mostly carbon dioxide.', 'There is far too much oxygen in the air.', 'The wind is always too strong to breathe.', 'The red dust in the air is poisonous.', 'There is no gravity to hold the air down.'], '"The air is very thin and mostly carbon dioxide".'],
  [2, 'Why does the discovery of old rivers and lakes excite scientists?', ['Water might mean that life once existed there.', 'They would like to go swimming on Mars.', 'It means that Mars is getting warmer.', 'It proves that Mars really is red.', 'It shows that Mars is bigger than Earth.'], 'It makes them "wonder whether tiny living things might once have existed".'],
  [2, 'Why is a year on Mars longer than a year on Earth?', ['Mars takes longer to travel round the Sun.', 'Mars spins much more slowly than Earth.', 'Mars is smaller than Earth, so years last longer.', 'Mars is colder, so the seasons last longer.', 'Mars has more days in every single week.'], 'It takes 687 Earth days to orbit the Sun.'],
  [3, 'Why does the writer compare Olympus Mons with Mount Everest?', ['To help the reader imagine how enormous it is.', 'To show that the two mountains are side by side.', 'To show that Mount Everest is on Mars.', 'To show that they are exactly the same height.', 'To show that climbers have visited Olympus Mons.'], 'Comparing with a mountain we know helps us picture its size.'],
  [3, 'What is the purpose of the third paragraph?', ['To explain why Mars would be a hard place to live.', 'To describe the history of space travel.', 'To explain how the robot rovers work.', 'To persuade people to move to Mars.', 'To describe the colours seen on Mars.'], 'It covers thin air, freezing cold and dust storms.'],
  [3, 'What does "Even so" at the start of the last paragraph signal?', ['A change from the difficulties to why Mars still interests people.', 'A sign that the passage is about to come to an end.', 'That the writer agrees with every point in paragraph three.', 'The start of a list of even more dangers on Mars.', 'That Mars would actually be an easy place to live.'], 'It turns from the problems to the reasons scientists are fascinated.']
]);

add('n2_chocolate', 'fact', 'From Bean to Bar', `Chocolate begins its life on the cacao tree, which grows only in hot, rainy places near the equator, such as Ghana, Ivory Coast and Ecuador. The tree produces large, colourful pods that grow straight out of its trunk. Each pod holds around forty pale beans surrounded by a sweet white pulp.

Farmers cut the ripe pods down by hand, often using a machete. The beans and pulp are scooped out and left in heaps under banana leaves for about a week. During this time they ferment, which turns the beans brown and begins to create the chocolate flavour. The beans are then spread out in the sun to dry.

At a factory, the dried beans are roasted, which deepens their flavour, and their shells are removed. What remains is ground into a thick, dark paste called cocoa liquor. Despite its name, it contains no alcohol. Sugar, extra cocoa butter and sometimes milk are added, and the mixture is stirred for many hours to make it smooth.

Finally, the chocolate is heated and cooled carefully so that it sets with a glossy shine and a satisfying snap. It is then poured into moulds and wrapped, ready for the shops.`, [
  [1, 'About how many beans does each cacao pod hold?', ['around forty', 'around four', 'around four hundred', 'one', 'around ten'], '"Each pod holds around forty pale beans".'],
  [1, 'What are the beans covered with while they ferment?', ['banana leaves', 'sacks', 'plastic sheets', 'sugar', 'cocoa butter'], '"left in heaps under banana leaves".'],
  [1, 'What is cocoa liquor?', ['a thick, dark paste made from ground beans', 'a strong drink that contains a lot of alcohol', 'the sweet white pulp found inside the pod', 'melted sugar mixed with warm cocoa butter', 'the crushed shells taken off the roasted beans'], '"ground into a thick, dark paste called cocoa liquor".'],
  [2, 'Why can cacao trees not be grown in Britain?', ['They need hot, rainy places near the equator.', 'They need snow and frost to grow properly.', 'They grow far too tall for British gardens.', 'British farmers are not allowed to use machetes.', 'They only grow in dry, sandy deserts.'], 'The tree "grows only in hot, rainy places near the equator".'],
  [2, 'Why does the writer explain that cocoa liquor contains no alcohol?', ['Because its name might make readers think it does.', 'Because cocoa liquor can be dangerous to eat.', 'Because cocoa liquor is only sold to adults.', 'Because cocoa liquor is used as a medicine.', 'Because cocoa liquor is too sweet to eat alone.'], '"Despite its name, it contains no alcohol" clears up a likely misunderstanding.'],
  [2, 'Which step first begins to create the chocolate flavour?', ['fermenting', 'roasting', 'grinding', 'adding sugar', 'wrapping'], 'Fermenting "begins to create the chocolate flavour".'],
  [3, 'How is the passage organised?', ['In the order that chocolate is made, from tree to shop.', 'As a list of the best chocolate brands in the shops.', 'As a recipe, with a list of the ingredients first.', 'As a story about one farmer and his family.', 'In order of importance, starting with the factory.'], 'It follows the bean from the tree to the factory to the shops.'],
  [3, 'Why does the writer use the phrase "a satisfying snap"?', ['To help the reader imagine the sound and feel of good chocolate.', 'To warn the reader that chocolate can break teeth.', 'To describe the sound the pods make when they are cut.', 'To show that chocolate is soft and easy to bend.', 'To describe the noise of the machete in the forest.'], 'It appeals to the senses and makes the chocolate sound appealing.'],
  [3, 'What kind of text is this?', ['an explanation of a process', 'a persuasive advert', 'a diary', 'a poem', 'a newspaper interview'], 'It explains, step by step, how chocolate is made.']
]);

add('n2_plastic', 'fact', 'Should We Ban Plastic Bottles?', `Every minute, around one million plastic bottles are bought around the world. Many are used once and thrown away. Some people believe that single-use plastic bottles should be banned altogether. Others think there are better ways to tackle the problem.

Those in favour of a ban point out that plastic takes hundreds of years to break down. Bottles that are not recycled often end up in rivers and oceans, where they harm sea creatures. Turtles can mistake plastic for food, and tiny pieces called microplastics have even been found inside fish that people eat. A ban, they say, would force companies and shoppers to change their habits quickly.

However, others argue that a ban could cause problems. Bottled water is important in emergencies, such as floods, when tap water may not be safe. Some people with disabilities find refillable bottles harder to use. Instead of a ban, these people suggest deposit schemes, in which shoppers pay a few pence extra for each bottle and get the money back when they return it. In countries that use deposit schemes, more than nine out of ten bottles are returned.

Whichever side you agree with, almost everyone accepts that the amount of plastic waste must be reduced.`, [
  [1, 'About how many plastic bottles are bought every minute?', ['around one million', 'around one thousand', 'around ten', 'around one billion', 'nine out of ten'], '"around one million plastic bottles are bought".'],
  [1, 'What are microplastics?', ['tiny pieces of plastic', 'small bottles', 'a kind of fish', 'recycling machines', 'plastic bags'], '"tiny pieces called microplastics".'],
  [1, 'In a deposit scheme, how do shoppers get their money back?', ['by returning the bottle', 'by recycling at home', 'by buying another bottle', 'by writing to the company', 'by filling the bottle with tap water'], 'They "get the money back when they return it".'],
  [2, 'Why might bottled water be important in a flood?', ['Tap water may not be safe to drink.', 'There is too much water to drink.', 'Shops close during floods.', 'Bottles float.', 'Floods break all the cups.'], '"when tap water may not be safe".'],
  [2, 'What does the fact that "more than nine out of ten bottles are returned" suggest?', ['Deposit schemes work well.', 'Nobody uses deposit schemes.', 'People throw most bottles away.', 'Bans are better than deposit schemes.', 'Bottles are too expensive.'], 'Such a high return rate shows the schemes are effective.'],
  [2, 'What do both sides agree about?', ['Plastic waste needs to be reduced.', 'Plastic bottles should be banned.', 'Deposit schemes do not work.', 'Turtles like plastic.', 'Plastic breaks down quickly.'], '"almost everyone accepts that the amount of plastic waste must be reduced".'],
  [3, 'Why does the writer give arguments for both sides?', ['To present a balanced view so the reader can decide.', 'Because the writer cannot make up their mind.', 'To confuse the reader about plastic bottles.', 'To persuade the reader to buy more bottles.', 'Because the passage is really a story.'], 'A balanced discussion sets out both sides fairly.'],
  [3, 'What job does the word "However" do at the start of the third paragraph?', ['It signals a change to the opposite point of view.', 'It adds one more reason in favour of a ban.', 'It tells the reader that the argument has ended.', 'It introduces an example of a plastic bottle.', 'It shows that time has moved on in the text.'], '"However" introduces the arguments against a ban.'],
  [3, 'Why does the passage begin with a large number?', ['To grab attention and show the size of the problem.', 'To teach the reader how to count large numbers.', 'To show that plastic bottles are very cheap.', 'Because the passage is really a maths lesson.', 'To show that the writer works in a shop.'], 'A startling statistic hooks the reader immediately.']
]);

add('n2_romans', 'fact', 'Roman Roads', `When the Romans invaded Britain in AD 43, they found a land with few proper roads. Most people travelled along muddy tracks that turned to swamp in winter. The Romans quickly set about changing this. Over the next few centuries they built around 3,000 kilometres of paved roads across the country.

Roman roads were famously straight. Surveyors used simple tools, such as a groma, a pole with weights hanging from a cross, to mark out straight lines between high points. Where they could, they went over hills rather than around them, because the shortest route was usually the quickest.

Building a road took great skill. Workers dug a trench and filled it with layers: large stones at the bottom, then smaller stones and gravel, and finally flat paving slabs or tightly packed gravel on top. The surface was curved, higher in the middle than at the edges, so that rainwater drained away into ditches on either side.

The roads allowed soldiers to march quickly from one fort to another, but they were also used by traders, messengers and ordinary travellers. Many of Britain's main roads today still follow the routes the Romans chose nearly two thousand years ago.`, [
  [1, 'In which year did the Romans invade Britain?', ['AD 43', 'AD 410', '43 BC', 'AD 1066', 'AD 300'], '"When the Romans invaded Britain in AD 43".'],
  [1, 'What was a groma?', ['a pole with weights hanging from a cross', 'a type of paving slab', 'a Roman soldier', 'a ditch beside the road', 'a kind of cart'], '"a groma, a pole with weights hanging from a cross".'],
  [1, 'What was put at the bottom of the trench?', ['large stones', 'paving slabs', 'gravel', 'sand', 'wood'], '"large stones at the bottom".'],
  [2, 'Why did the Romans go over hills rather than around them?', ['It was usually the shortest and quickest route.', 'Hills were safer from wild wolves.', 'The soldiers liked the views from the top.', 'Hills were always less muddy than valleys.', 'They did not know how to build round them.'], '"the shortest route was usually the quickest".'],
  [2, 'Why was the road surface higher in the middle?', ['So that rainwater would run off into the ditches.', 'So that carts would go faster.', 'To make it look grand.', 'To stop soldiers falling over.', 'So that the road could be seen from far away.'], 'It was curved "so that rainwater drained away".'],
  [2, 'Why were good roads especially useful to the Roman army?', ['Soldiers could march quickly between forts.', 'Soldiers could hide in the ditches.', 'The roads kept enemy soldiers out.', 'The roads were used for battle practice.', 'The army built houses along the roads.'], '"The roads allowed soldiers to march quickly from one fort to another".'],
  [3, 'Why does the writer describe the old tracks as turning "to swamp in winter"?', ['To show how much better the Roman roads were.', 'To show that Britain was warm and wet in winter.', 'To explain how swamps form in the countryside.', 'To show that the Romans enjoyed walking in mud.', 'To describe the floor of a Roman bath house.'], 'Contrasting muddy tracks with paved roads shows the improvement.'],
  [3, 'What is the purpose of the third paragraph?', ['To explain how a Roman road was built, layer by layer.', 'To describe the soldiers who marched along the roads.', 'To explain why the roads were built so straight.', 'To list the most famous Roman roads in Britain.', 'To compare Roman roads with modern motorways.'], 'It describes digging the trench and each layer in order.'],
  [3, 'What does the last sentence show about Roman roads?', ['They were so well planned that their routes are still used.', 'They have all disappeared under modern buildings.', 'They were only ever used by Roman soldiers.', 'They were built quite recently, not long ago.', 'They were badly made and had to be replaced.'], 'Modern roads "still follow the routes the Romans chose".']
]);

// ------------------------------------------------------------------ poems
add('p2_market', 'poem', 'Saturday Market', `The market wakes before the sun,
With clatter, shout and creaking cart;
The canvas roofs go up, each one
A sail upon a sea of art.

There's apples piled like rosy hills,
And cheeses round as harvest moons,
A man who sells his wooden mills
That whirl and sing their whistling tunes.

The fish stall gleams with silver light,
The flower stall is spilling gold,
And Mrs Patel, small and bright,
Sells stories with the spice she's sold.

By four the crowds have drifted home,
The stalls are folded, swept and bare,
And only pigeons, left to roam,
Remember all the colours there.`, [
  [1, 'When does the market start?', ['before the sun rises', 'at noon', 'at four o\'clock', 'in the evening', 'at midnight'], 'The first line says "The market wakes before the sun".'],
  [1, 'What does Mrs Patel sell?', ['spice', 'fish', 'flowers', 'cheese', 'wooden mills'], 'She "Sells stories with the spice she\'s sold."'],
  [1, 'Who is left at the market at the end?', ['the pigeons', 'Mrs Patel', 'the man with the mills', 'the crowds', 'the fish seller'], '"only pigeons, left to roam".'],
  [2, 'What does "Sells stories with the spice" suggest about Mrs Patel?', ['She chats and tells stories to her customers.', 'She sells books of stories as well as spices.', 'She is a famous writer who works at the market.', 'She is very quiet and never speaks to anyone.', 'She does not enjoy working on the spice stall.'], 'She shares stories as well as selling spice, so she is friendly and chatty.'],
  [2, 'What time has the market finished by?', ['four o\'clock', 'midday', 'sunrise', 'midnight', 'six o\'clock'], '"By four the crowds have drifted home".'],
  [2, 'How does the mood change in the last verse?', ['From busy and colourful to quiet and empty.', 'From sad and grey to happy and colourful.', 'From quiet and empty to loud and crowded.', 'From frightening and dark to funny and bright.', 'It stays exactly the same all the way through.'], 'The crowds leave and the stalls are "bare".'],
  [3, 'What does "apples piled like rosy hills" make you picture?', ['big, rounded heaps of red apples', 'apples growing on hills', 'a farm in the distance', 'roses on the stall', 'apples falling down a hill'], 'The simile compares the heaps of apples to round, rosy hills.'],
  [3, 'Why does the poet compare the canvas roofs to sails?', ['To make the market look like ships on a sea.', 'Because the market is held on a large boat.', 'Because it is so windy that the roofs blow away.', 'Because the stalls at the market all sell sails.', 'Because the canvas roofs are painted bright blue.'], '"A sail upon a sea of art" turns the stalls into a fleet of ships.'],
  [3, 'What is the rhyme pattern in each verse?', ['Lines 1 and 3 rhyme, and lines 2 and 4 rhyme.', 'Every line in each verse rhymes with the others.', 'None of the lines in the poem rhyme at all.', 'Only lines 1 and 2 in each verse rhyme together.', 'Only the last line of each verse has a rhyme.'], 'For example: sun/one and cart/art.']
]);

add('p2_storm', 'poem', 'Storm Coming', `The sky has turned a bruised and purple grey;
The washing on the line begins to dance.
The birds have all gone quiet, flown away,
The garden waits, as if it's in a trance.

The first fat drops come thudding on the shed,
Like someone knocking, slowly, to get in.
Then all at once the clouds break overhead,
And rain comes rushing down with such a din!

The thunder grumbles like a giant's stomach,
The lightning cracks the dark sky into two,
And I, safe in my window seat, with Grandad,
Count the seconds, till the storm is through.`, [
  [1, 'What colour is the sky at the start?', ['purple grey', 'bright blue', 'black', 'pink', 'white'], '"a bruised and purple grey".'],
  [1, 'Where do the first drops land?', ['on the shed', 'on the washing', 'on the window', 'on the birds', 'on Grandad'], '"The first fat drops come thudding on the shed".'],
  [1, 'Who is the speaker with?', ['Grandad', 'a friend', 'Mum', 'a dog', 'nobody'], '"in my window seat, with Grandad".'],
  [2, 'Why have the birds "gone quiet, flown away"?', ['They can sense the storm coming.', 'It is night-time.', 'A cat scared them.', 'They are migrating for winter.', 'They are eating.'], 'Animals often hide before a storm.'],
  [2, 'How does the speaker feel during the storm?', ['safe and interested', 'terrified', 'bored', 'angry', 'lonely'], 'They are "safe in my window seat" and counting the seconds.'],
  [2, 'Why might the speaker "Count the seconds"?', ['To work out how far away the storm is.', 'To time how long the rain lasts for.', 'Because they are bored at the window.', 'To practise their times tables homework.', 'To see when Grandad will wake up again.'], 'Counting between lightning and thunder shows how far away a storm is.'],
  [3, 'What does "bruised" suggest about the sky?', ['It is dark and blotchy, as if hurt.', 'It is clear, calm and bright blue.', 'It is very high and far away.', 'It is slowly getting lighter.', 'It is full of flying birds.'], 'A bruise is purple and dark, like the stormy sky.'],
  [3, 'Why does the poet compare the raindrops to "someone knocking, slowly, to get in"?', ['To make the rain seem like a visitor wanting to come inside.', 'To show that a friend has arrived at the shed door.', 'To show that the door of the shed has been broken.', 'To show that the rain is light and gentle and quiet.', 'To show that the storm has stopped and gone away.'], 'The slow, heavy drops sound like knocking at a door.'],
  [3, 'What is the effect of "The thunder grumbles like a giant\'s stomach"?', ['It makes the thunder sound deep and rumbling, but also a little funny.', 'It makes the thunder seem soft, quiet and gentle.', 'It shows that the speaker is feeling very hungry.', 'It shows that a real giant is hiding nearby.', 'It shows that the storm has finished and moved on.'], 'A hungry giant\'s stomach makes a deep, rumbling sound.']
]);

add('p2_seed', 'poem', 'The Seed', `I am a seed, as small as small,
Pressed in the dark beneath the ground;
I have no eyes, no voice at all,
I do not move, I make no sound.

But something in me knows the way,
And when the spring rain soaks me through,
I split my coat, and day by day
I push towards a sky of blue.

A root goes down, a shoot goes up,
I lift two leaves to taste the light,
I open like a golden cup,
And turn my face from left to right.

So when you think you are too small
To change the world, or make it new,
Remember me, who had no wall
To climb, and still I broke right through.`, [
  [1, 'What makes the seed start to grow?', ['the spring rain', 'the summer sun', 'a gardener', 'the wind', 'the snow'], '"when the spring rain soaks me through".'],
  [1, 'What goes down into the ground?', ['a root', 'a shoot', 'a leaf', 'a flower', 'the coat'], '"A root goes down, a shoot goes up".'],
  [1, 'How many leaves does the seedling lift?', ['two', 'one', 'three', 'four', 'many'], '"I lift two leaves to taste the light".'],
  [2, 'What is the seed\'s "coat"?', ['the outer covering of the seed', 'a warm piece of winter clothing', 'the soil that covers the seed', 'the first green leaf of the plant', 'a petal from the open flower'], 'A seed has a hard outer covering that splits when it grows.'],
  [2, 'What kind of flower does the seed probably become?', ['a yellow flower that turns towards the sun', 'a blue flower that grows in shade', 'a tree', 'a cactus', 'a red rose that grows at night'], '"golden cup" and turning its face suggest a yellow flower following the sun.'],
  [2, 'Who is the last verse speaking to?', ['the reader', 'another seed', 'a gardener', 'the rain', 'the sun'], '"So when you think you are too small" speaks directly to the reader.'],
  [3, 'Why is the poem written as if the seed is speaking?', ['To help the reader imagine what growing is like from the seed\'s point of view.', 'Because seeds really can talk to the people who plant them.', 'To turn the poem into a short play for children.', 'To confuse the reader about who is speaking.', 'Because the poet is a gardener who grows seeds.'], 'Using "I" makes us see the world through the seed\'s eyes.'],
  [3, 'What does "lift two leaves to taste the light" suggest?', ['The plant reaches eagerly for the sunlight it needs.', 'The plant is beginning to eat its own leaves.', 'The leaves are starting to fall off the plant.', 'The plant does not like the light at all.', 'It is night-time and the plant is sleeping.'], 'Plants need light; "taste" makes it seem eager and alive.'],
  [3, 'What is the message of the last verse?', ['Even someone small can achieve great things.', 'Seeds should always be planted in spring.', 'Walls are dangerous for small children.', 'You should not plant seeds next to walls.', 'Flowers are much better than trees.'], 'The seed was tiny but still "broke right through".']
]);

add('p2_shoes', 'poem', 'My Old Trainers', `They're split along the side, they let the rain in,
The laces have been knotted twenty times;
They've lost their colour (no one knows what it was in
The beginning), and they smell of mud and limes.

But they have climbed the castle wall at Conwy,
They've scored the winning goal against Year Five,
They've jumped the stream (well, nearly) and come home, squelchy,
They've danced at Auntie's wedding, I'm alive

In every scuff and stain, in every crease.
So Mum can buy me new ones if she must,
All white and stiff, but please, oh please,
Don't throw these out. I'll keep them in the dust

Beneath my bed, with every place we've been,
The best adventures that I've ever seen.`, [
  [1, 'How many times have the laces been knotted?', ['twenty', 'two', 'ten', 'a hundred', 'once'], '"The laces have been knotted twenty times".'],
  [1, 'Where is the castle wall that the trainers climbed?', ['Conwy', 'Year Five', 'the stream', 'Auntie\'s wedding', 'under the bed'], '"the castle wall at Conwy".'],
  [1, 'Where will the speaker keep the old trainers?', ['in the dust beneath the bed', 'in the bin', 'in a cupboard', 'in the garden', 'at Auntie\'s house'], '"I\'ll keep them in the dust / Beneath my bed".'],
  [2, 'Why does the speaker want to keep the old trainers?', ['They remind the speaker of happy adventures.', 'They are still the most comfortable shoes.', 'New trainers are too expensive.', 'They smell nice.', 'Mum told them to.'], 'Each scuff and stain is a memory of "every place we\'ve been".'],
  [2, 'What does "(well, nearly)" tell us about jumping the stream?', ['The speaker did not quite make it across.', 'The stream was so small it was easy to cross.', 'The speaker jumped right over it without trouble.', 'The speaker decided not to try jumping at all.', 'The stream had dried up in the summer heat.'], 'They came home "squelchy", so they landed in the water.'],
  [2, 'How does the speaker feel about new trainers?', ['They do not want them as much as the old ones.', 'They are very excited about getting them.', 'They want them to be muddy straight away.', 'They do not need any shoes at all.', 'They want them in a different colour.'], 'New ones are "white and stiff", and they beg to keep the old ones.'],
  [3, 'Why does the poet list all the things the trainers have done?', ['To show how many memories they hold.', 'To show the trainers are new.', 'To show the speaker is boastful.', 'To make the poem rhyme.', 'To explain where to buy trainers.'], 'The list builds up a picture of a life full of adventures.'],
  [3, 'What does "I\'m alive / In every scuff and stain" mean?', ['The speaker\'s life and memories are recorded in the marks on the shoes.', 'The trainers have come to life and can talk.', 'The speaker has been ill and is now getting better.', 'The trainers badly need a good clean.', 'The speaker is hiding inside the trainers.'], 'Each mark is a sign of something the speaker did.'],
  [3, 'What is the tone of the poem?', ['affectionate and humorous', 'angry and bitter', 'frightened', 'formal and serious', 'bored'], 'The speaker loves the trainers and jokes about them.']
]);

add('p2_night', 'poem', 'City at Night', `When the city goes to sleep,
It never shuts its eyes;
The street lamps keep their watch, and keep
Their orange lullabies.

The buses yawn along the road,
Half empty, warm and slow,
A fox trots by with his own load
Of secrets, soft and low.

High up, a single window glows
Where someone cannot rest,
A baker kneads, and no one knows
The city loves him best,

Because by dawn, when all awake,
And rush and shout and run,
He'll hand the sleepy town its cake
And bread, warm as the sun.`, [
  [1, 'What colour is the light from the street lamps?', ['orange', 'yellow', 'white', 'blue', 'green'], '"Their orange lullabies".'],
  [1, 'Which animal trots by?', ['a fox', 'a cat', 'a dog', 'an owl', 'a mouse'], '"A fox trots by".'],
  [1, 'Who is working in the night?', ['a baker', 'a bus driver', 'a police officer', 'a nurse', 'a teacher'], '"A baker kneads".'],
  [2, 'Why are the buses "half empty"?', ['Few people travel late at night.', 'The buses have all broken down.', 'It is a bank holiday weekend.', 'The bus fares are far too high.', 'The buses are very large ones.'], 'At night most people are asleep, so there are few passengers.'],
  [2, 'Why does the poet say "the city loves him best"?', ['He makes fresh bread for everyone in the morning.', 'He is the mayor, who looks after the whole city.', 'He is the only person in the city who is awake.', 'He drives the night buses round the empty streets.', 'He looks after the fox that trots through the town.'], 'By dawn he gives the town fresh bread and cake.'],
  [2, 'What is suggested by the window "Where someone cannot rest"?', ['Someone is awake, perhaps worried or busy.', 'Someone is having a noisy party.', 'The window has been broken by the wind.', 'It is daytime and the sun is shining.', 'The house is empty and for sale.'], 'A lit window at night shows someone who cannot sleep.'],
  [3, 'What does "It never shuts its eyes" suggest about the city?', ['The city is always partly awake, even at night.', 'The city has no windows or doors.', 'The city is frightened of the dark.', 'The city is completely silent at night.', 'The city is closed until the morning.'], 'The city is given eyes that stay open, like lights that stay on.'],
  [3, 'Why does the poet say the buses "yawn"?', ['To make them seem sleepy and slow, like tired people.', 'To show that the buses are very loud at night.', 'To show that the buses are moving very fast.', 'To show that the buses are completely empty.', 'To show that buses really can breathe air.'], 'Yawning makes the buses seem tired, matching the night-time mood.'],
  [3, 'How does the last verse contrast with the rest of the poem?', ['It moves from quiet night to the busy rush of morning.', 'It moves from the busy morning to the quiet night.', 'It changes from a happy mood to a sad one.', 'It is written as a list instead of a poem.', 'It is the only verse that does not rhyme.'], '"rush and shout and run" contrasts with the sleepy night.']
]);
})();
