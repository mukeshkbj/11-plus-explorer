/* Maths course: topics in teaching order, with a short lesson for each.
   To add a topic: add an entry here, then add questions with the same topic id in maths-questions.js. */
window.BANK = window.BANK || {};
window.BANK.maths = {
  id: 'maths',
  name: 'Maths',
  topics: [
    { id: 'place_value', name: 'Place value', lesson: {
      text: 'Every digit in a number has a value that depends on its column. From the right, the columns are ones, tens, hundreds, thousands, ten thousands, hundred thousands and millions. After the decimal point come tenths, hundredths and thousandths.\n\nTo round a number, find the column you are rounding to, then look at the digit to its right. If that digit is 5 or more, round up. If it is 4 or less, the digit stays the same.\n\nNegative numbers are below zero. On a number line they sit to the left of 0, so −7 is smaller than −2.',
      example: 'Round 4,672 to the nearest hundred. The hundreds digit is 6. The digit to its right is 7, which is 5 or more, so round up. Answer: 4,700.',
      watch: 'When you write a number such as forty thousand and sixteen, remember the zeros that hold the empty columns: 40,016, not 4,016.' } },
    { id: 'four_ops', name: 'Four operations', lesson: {
      text: 'The four operations are adding, subtracting, multiplying and dividing. Adding and subtracting undo each other. Multiplying and dividing undo each other. These pairs are called inverses, and you can use them to check answers or find missing numbers.\n\nFor big multiplications, split a number into parts, multiply each part, then add. For division, ask "how many of these fit?" and use your times tables.\n\nWhen a calculation has several steps, follow the order: brackets first, then multiply and divide, then add and subtract.',
      example: '6 + 4 × 5. Multiply first: 4 × 5 = 20. Then add: 6 + 20 = 26.',
      watch: 'Do not just work from left to right. 6 + 4 × 5 is 26, not 50.' } },
    { id: 'fractions', name: 'Fractions', lesson: {
      text: 'A fraction shows equal parts of a whole. The bottom number (denominator) says how many equal parts there are. The top number (numerator) says how many parts you have.\n\nEquivalent fractions look different but are worth the same, such as 1/2 and 4/8. Make them by multiplying or dividing the top and bottom by the same number.\n\nTo find a fraction of an amount, divide by the bottom and multiply by the top. To add or subtract fractions, first give them the same denominator.',
      example: 'Find 3/4 of 20. Divide by the bottom: 20 ÷ 4 = 5. Multiply by the top: 5 × 3 = 15.',
      watch: 'When adding fractions, never add the denominators. 1/4 + 2/4 is 3/4, not 3/8.' } },
    { id: 'decimals', name: 'Decimals', lesson: {
      text: 'Decimals are another way to write parts of a whole. The first place after the point is tenths, the second is hundredths and the third is thousandths. So 0.37 means 3 tenths and 7 hundredths.\n\nWhen adding or subtracting decimals, always line up the decimal points.\n\nMultiplying by 10, 100 or 1000 moves every digit one, two or three places to the left. Dividing moves the digits to the right.\n\nSome useful facts: 1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/10 = 0.1 and 1/5 = 0.2.',
      example: 'Which is bigger, 0.6 or 0.57? Write both with two decimal places: 0.60 and 0.57. Now 60 hundredths is more than 57 hundredths, so 0.6 is bigger.',
      watch: 'A longer decimal is not always bigger. 0.125 is smaller than 0.5.' } },
    { id: 'percentages', name: 'Percentages', lesson: {
      text: 'Per cent means "out of 100". So 30% means 30 out of every 100, which is 30/100 or 0.3.\n\nSome percentages are easy to find. 50% is a half, 25% is a quarter and 10% is a tenth (divide by 10). Build other percentages from these: 20% is two lots of 10%, 5% is half of 10%, and 75% is three quarters.\n\nTo take a percentage off a price, find the percentage first and then subtract it.',
      example: 'Find 30% of 80. First 10% of 80 is 8. Then 30% is three lots: 3 × 8 = 24.',
      watch: 'In a sale question, read carefully. "How much is saved?" and "What is the sale price?" have different answers.' } },
    { id: 'ratio', name: 'Ratio and proportion', lesson: {
      text: 'A ratio compares amounts. If there are 2 red beads for every 3 blue beads, the ratio of red to blue is 2:3. The order matters.\n\nYou can simplify a ratio like a fraction, by dividing both numbers by the same amount. So 6:9 becomes 2:3.\n\nTo share an amount in a ratio, add the parts, find the value of one part, then multiply.\n\nFor recipes, find the amount for one person first, then multiply up.',
      example: 'Share £30 in the ratio 2:3. There are 2 + 3 = 5 parts. One part is £30 ÷ 5 = £6. The shares are 2 × £6 = £12 and 3 × £6 = £18.',
      watch: 'Do not divide by just one of the ratio numbers. Always add the parts together first.' } },
    { id: 'algebra', name: 'Algebra basics', lesson: {
      text: 'In algebra a letter stands for a number we do not know yet. 3n means 3 × n, and n + 5 means 5 more than n.\n\nTo find the value of an expression, swap each letter for its number and work it out.\n\nTo solve an equation, undo each step using the inverse, working backwards. Whatever you do to one side, do to the other side too, so it stays balanced like a set of scales.',
      example: 'Solve 2n + 3 = 17. Undo the + 3 by subtracting 3: 2n = 14. Undo the × 2 by dividing by 2: n = 7. Check: 2 × 7 + 3 = 17.',
      watch: 'If n = 4, then 3n is 12, not 34. The 3 and the n are multiplied, not placed side by side.' } },
    { id: 'sequences', name: 'Sequences', lesson: {
      text: 'A sequence is a list of numbers that follows a rule. To find the rule, look at the gap between each number and the next.\n\nIf the gap is always the same, the rule is add or subtract that amount. If the gaps keep growing, check whether the numbers are being multiplied, or whether the gaps themselves follow a pattern.\n\nSome special sequences are worth knowing: square numbers (1, 4, 9, 16, 25) and triangular numbers (1, 3, 6, 10, 15).\n\nA rule such as 3n + 1 tells you any term. Put the position number in place of n.',
      example: 'Find the next number: 5, 9, 13, 17. Each gap is 4, so the rule is add 4. Next is 17 + 4 = 21.',
      watch: 'Check the rule works for every pair, not just the first two numbers.' } },
    { id: 'measures', name: 'Measures', lesson: {
      text: 'We measure length in millimetres, centimetres, metres and kilometres. We measure mass in grams and kilograms, and capacity in millilitres and litres.\n\nKey facts: 10 mm = 1 cm, 100 cm = 1 m, 1000 m = 1 km, 1000 g = 1 kg and 1000 ml = 1 litre.\n\nTo change a bigger unit into a smaller one, multiply. To change a smaller unit into a bigger one, divide.\n\nBefore adding or comparing measurements, make sure they are in the same unit.',
      example: 'Change 2.5 km into metres. 1 km = 1000 m, so 2.5 × 1000 = 2500 m.',
      watch: 'Kilo means a thousand, but centi means a hundredth. There are 100 cm in a metre, not 1000.' } },
    { id: 'time', name: 'Time', lesson: {
      text: 'There are 60 seconds in a minute, 60 minutes in an hour, 24 hours in a day and 7 days in a week.\n\nThe 24-hour clock counts the hours from 00 to 23. For afternoon and evening times, add 12 to the hour: 3:15 pm is 15:15.\n\nTo find how long something lasts, count up from the start time to the next hour, then on to the end time, and add the parts.',
      example: 'How long is it from 09:40 to 11:15? From 09:40 to 10:00 is 20 minutes. From 10:00 to 11:15 is 1 hour 15 minutes. Total: 1 hour 35 minutes.',
      watch: 'Time does not work in tens and hundreds. 1 hour 50 minutes plus 20 minutes is 2 hours 10 minutes, not 1 hour 70 minutes.' } },
    { id: 'money', name: 'Money', lesson: {
      text: 'There are 100 pence in a pound, so £3.45 is 345p. Money always has two digits after the point: write £2.50, not £2.5.\n\nTo find a total, add the prices. To find change, count up from the cost to the amount paid.\n\nTo compare value, work out the price of one item in each pack. The pack with the lower price for each item is better value.',
      example: 'A drink costs £1.35. How much change from £5? Count up: £1.35 to £2 is 65p. £2 to £5 is £3. Change: £3.65.',
      watch: 'Do not mix pounds and pence in one sum. Change everything to pence first, or everything to pounds.' } },
    { id: 'area_perimeter', name: 'Area and perimeter', lesson: {
      text: 'Perimeter is the distance all the way round a shape. Add up the lengths of every side.\n\nArea is the amount of space inside a flat shape. It is measured in square units such as cm².\n\nArea of a rectangle = length × width. Area of a triangle = base × height ÷ 2. Area of a parallelogram = base × perpendicular height.\n\nVolume is the space inside a 3D shape. Volume of a cuboid = length × width × height, measured in cubic units such as cm³.',
      example: 'A rectangle is 8 cm long and 3 cm wide. Perimeter: 8 + 3 + 8 + 3 = 22 cm. Area: 8 × 3 = 24 cm².',
      watch: 'Do not mix up the two. Perimeter is adding round the edge. Area is multiplying to fill the inside.' } },
    { id: 'angles', name: 'Angles', lesson: {
      text: 'An angle measures a turn, in degrees. A right angle is 90°. An acute angle is less than 90°. An obtuse angle is between 90° and 180°. A reflex angle is more than 180°.\n\nFour facts solve most problems. Angles on a straight line add up to 180°. Angles around a point add up to 360°. Angles in a triangle add up to 180°. Angles in a quadrilateral add up to 360°.\n\nAn isosceles triangle has two equal sides and two equal angles. An equilateral triangle has three angles of 60°.',
      example: 'Two angles in a triangle are 50° and 70°. Add them: 120°. Subtract from 180°: the third angle is 60°.',
      watch: 'Triangle and straight line use 180°. Quadrilateral and full turn use 360°. Choose the right total before you subtract.' } },
    { id: 'shapes', name: '2D and 3D shapes', lesson: {
      text: 'Flat shapes are 2D. Their names tell you the number of sides: triangle 3, quadrilateral 4, pentagon 5, hexagon 6, heptagon 7, octagon 8, nonagon 9, decagon 10. A regular shape has all sides and all angles equal.\n\nSolid shapes are 3D. They have faces (flat surfaces), edges (where two faces meet) and vertices (corners). A cube has 6 faces, 12 edges and 8 vertices.\n\nA prism has the same shape at both ends. A pyramid has one base and comes to a point.\n\nA line of symmetry cuts a shape into two halves that match exactly.',
      example: 'A triangular prism has 2 triangle ends and 3 rectangle sides, so it has 5 faces.',
      watch: 'A rectangle has only 2 lines of symmetry. Its diagonals are not lines of symmetry.' } },
    { id: 'coordinates', name: 'Coordinates', lesson: {
      text: 'Coordinates tell you where a point is on a grid. They are written as (x, y). The first number says how far along, and the second says how far up. Remember: along the corridor, then up the stairs.\n\nNegative coordinates go left of zero for x and below zero for y.\n\nA translation slides a shape. Moving right or left changes x. Moving up or down changes y.\n\nA reflection flips a shape in a mirror line. Each point ends up the same distance from the line on the other side.',
      example: 'Point (3, 2) moves 4 right and 1 down. x: 3 + 4 = 7. y: 2 − 1 = 1. The new point is (7, 1).',
      watch: 'Do not swap the numbers. (2, 5) and (5, 2) are different points.' } },
    { id: 'data', name: 'Data handling', lesson: {
      text: 'Data can be shown in tables, bar charts, line graphs and pie charts. Always read the title, the labels and the scale before answering.\n\nThe mean is one kind of average. Add up all the values, then divide by how many values there are.\n\nThe range is the biggest value take away the smallest. The median is the middle value when the numbers are in order.\n\nIn a pie chart the whole circle is 360°. A sector of 90° is one quarter of the total.',
      example: 'Find the mean of 4, 7 and 10. Add: 4 + 7 + 10 = 21. There are 3 numbers: 21 ÷ 3 = 7.',
      watch: 'Check the scale on a chart. One grid line is not always worth 1.' } },
    { id: 'word_problems', name: 'Word problems', lesson: {
      text: 'A word problem hides a calculation inside a story. Use four steps. Read it twice. Underline the numbers and the question. Decide which operations you need. Then check that your answer makes sense.\n\nClue words help. "Altogether" and "total" often mean add. "Left" and "difference" often mean subtract. "Each" and "rows of" often mean multiply. "Share equally" means divide.\n\nMany problems need two or three steps. Write down each step so you do not lose track.',
      example: 'Tickets cost £6 each. Dad buys 4 and pays with £30. Cost: 4 × £6 = £24. Change: £30 − £24 = £6.',
      watch: 'With remainders, think about the story. 50 children in cars of 4 need 13 cars, not 12, because nobody can be left behind.' } }
  ],
  flashcards: [
    { front: '7 × 8', back: '56' }, { front: '6 × 9', back: '54' }, { front: '12 × 12', back: '144' }, { front: '8 × 12', back: '96' },
    { front: '7 × 7', back: '49' }, { front: '9 × 9', back: '81' }, { front: '6 × 7', back: '42' }, { front: '11 × 12', back: '132' },
    { front: '8 × 8', back: '64' }, { front: '9 × 7', back: '63' }, { front: '72 ÷ 8', back: '9' }, { front: '108 ÷ 12', back: '9' },
    { front: '1/2 as a decimal and a percentage', back: '0.5 and 50%' }, { front: '1/4 as a decimal and a percentage', back: '0.25 and 25%' },
    { front: '3/4 as a decimal and a percentage', back: '0.75 and 75%' }, { front: '1/5 as a decimal and a percentage', back: '0.2 and 20%' },
    { front: '1/10 as a decimal and a percentage', back: '0.1 and 10%' }, { front: '1/8 as a decimal', back: '0.125' },
    { front: 'The first six square numbers', back: '1, 4, 9, 16, 25, 36' }, { front: 'The first six prime numbers', back: '2, 3, 5, 7, 11, 13' },
    { front: 'The first five triangular numbers', back: '1, 3, 6, 10, 15' }, { front: 'Factors of 24', back: '1, 2, 3, 4, 6, 8, 12, 24' },
    { front: 'Millimetres in a centimetre', back: '10' }, { front: 'Centimetres in a metre', back: '100' }, { front: 'Metres in a kilometre', back: '1000' },
    { front: 'Grams in a kilogram', back: '1000' }, { front: 'Millilitres in a litre', back: '1000' }, { front: 'Minutes in a day', back: '1440 (24 × 60)' },
    { front: 'Days in a leap year', back: '366' }, { front: '5 miles is about how many kilometres?', back: '8 km' },
    { front: 'Angles in a triangle add up to...', back: '180°' }, { front: 'Angles in a quadrilateral add up to...', back: '360°' },
    { front: 'Angles on a straight line add up to...', back: '180°' }, { front: 'Angles around a point add up to...', back: '360°' },
    { front: 'Area of a triangle', back: 'base × height ÷ 2' }, { front: 'Volume of a cuboid', back: 'length × width × height' },
    { front: 'Faces, edges and vertices of a cube', back: '6 faces, 12 edges, 8 vertices' }, { front: 'How do you find the mean?', back: 'Add all the values, then divide by how many there are' },
    { front: 'What is the order of operations?', back: 'Brackets, then × and ÷, then + and −' }, { front: 'Sides of a heptagon', back: '7' }
  ],
  questions: []
};

/* Deeper lesson notes: a step-by-step method, things to check and common traps for every maths topic. */
(function () {
  const more = {
    place_value: {
      method: ['Write the number in a place value chart: millions, hundred thousands, ten thousands, thousands, hundreds, tens, ones, then tenths and hundredths.', 'Find the digit you are asked about and read the name of its column.', 'Its value is the digit × the column value. For example, the 7 in 47,215 is 7 × 1,000 = 7,000.', 'To round, find the column you are rounding to, look at the digit to its right, and round up for 5 or more.'],
      checklist: ['Which column?', 'Zeros as place holders', 'Rounding digit: 5 or more rounds up', 'Negative numbers: further from zero is smaller'],
      traps: ['Forgetting place-holding zeros: forty thousand and sixteen is 40,016.', 'Rounding using the wrong digit.', 'Thinking −8 is bigger than −3.']
    },
    four_ops: {
      method: ['Estimate first so you know roughly what the answer should be.', 'Line numbers up in columns for adding and subtracting, starting with the ones.', 'For big multiplications, split one number into tens and ones, multiply both parts, then add.', 'For division, ask "how many of these fit?" and use your times tables.', 'Check with the inverse: adding checks subtracting, multiplying checks dividing.'],
      checklist: ['Estimate', 'Columns lined up', 'Carry and exchange', 'Brackets, then × and ÷, then + and −', 'Check with the inverse'],
      traps: ['Working left to right when there is × or ÷ later in the sum.', 'Forgetting to carry or exchange.', 'In word problems with remainders, not deciding whether to round up or down.']
    },
    fractions: {
      method: ['The bottom number (denominator) says how many equal parts. The top (numerator) says how many you have.', 'To find a fraction of an amount: divide by the bottom, multiply by the top.', 'To compare or add, make the bottom numbers the same first.', 'Simplify by dividing the top and bottom by the same number.'],
      checklist: ['Same denominator?', 'Simplest form', 'Improper ↔ mixed number', 'Divide by the bottom, times by the top'],
      traps: ['Adding the bottom numbers: 1/4 + 1/4 is 2/4, not 2/8.', 'Thinking a bigger bottom number means a bigger fraction (1/8 is smaller than 1/4).', 'Using the whole amount when the question says "of the rest".']
    },
    decimals: {
      method: ['Line up the decimal points when you add or subtract. Fill gaps with zeros: 3.5 is 3.50.', 'To multiply a decimal, multiply without the point, then put the same number of decimal places back.', '× 10, 100 or 1,000 moves digits left; ÷ moves them right.', 'Compare decimals by giving them the same number of decimal places.'],
      checklist: ['Points lined up', 'Same number of decimal places', 'Digits move, the point stays', 'Money is two decimal places'],
      traps: ['Thinking 0.45 is bigger than 0.5 because 45 is bigger than 5.', 'Lining up the right-hand digits instead of the points.', 'Writing £3.5 instead of £3.50.']
    },
    percentages: {
      method: ['Per cent means "out of 100".', 'Find 10% by dividing by 10. Find 1% by dividing by 100. Find 50% by halving and 25% by halving again.', 'Build other percentages from these: 35% = 10% + 10% + 10% + 5%.', 'For an increase add it on; for a decrease or discount take it off.'],
      checklist: ['10% = ÷ 10', '50% = half', '25% = quarter', 'Increase: add on', 'Sale: take off'],
      traps: ['Giving the discount instead of the new price.', 'Thinking 5% is ÷ 5 (it is half of 10%).']
    },
    ratio: {
      method: ['A ratio compares parts, like 2 : 3.', 'To share in a ratio, add the parts to find how many shares there are.', 'Divide the total by the number of shares to find one share.', 'Multiply one share by each part of the ratio.', 'For recipes, find how many times bigger the new amount is and multiply everything by that.'],
      checklist: ['Add the parts', 'Value of one share', 'Order matters', 'Simplify like a fraction'],
      traps: ['Dividing by the number of parts in the ratio instead of the total of the parts.', 'Mixing up the order: 2 : 3 is not the same as 3 : 2.']
    },
    algebra: {
      method: ['A letter stands for an unknown number.', '3n means 3 × n. n² means n × n.', 'To solve, undo each step in reverse order, doing the same to both sides.', 'To substitute, swap the letter for its number, then follow the order of operations.', 'Check your answer by putting it back in.'],
      checklist: ['Same to both sides', 'Undo in reverse', '3n means 3 × n', 'Check by substituting'],
      traps: ['Reading 3n as thirty-something when n = 5 (it is 3 × 5 = 15).', 'Undoing the steps in the wrong order.']
    },
    sequences: {
      method: ['Find the difference between each pair of numbers.', 'If the differences are the same, keep adding (or taking away) that amount.', 'If the differences change, look for a pattern in the differences.', 'Also check for doubling, halving, square numbers and triangle numbers.', 'For an nth term rule, put the position number in place of n.'],
      checklist: ['Differences', 'Differences of differences', 'Multiplying?', 'Square numbers', 'Two series taking turns'],
      traps: ['Assuming it always goes up by the same amount.', 'Miscounting when the sequence goes below zero.']
    },
    measures: {
      method: ['Learn the key facts: 10 mm = 1 cm, 100 cm = 1 m, 1,000 m = 1 km, 1,000 g = 1 kg, 1,000 ml = 1 l.', 'Big unit to small unit: multiply. Small unit to big unit: divide.', 'Change everything into the same unit before you add, subtract or compare.', 'Read scales carefully: work out what each small mark is worth.'],
      checklist: ['Same units', 'Big → small: ×', 'Small → big: ÷', 'Value of each mark on a scale'],
      traps: ['Multiplying when you should divide.', 'Adding 2 m and 50 cm to get 52.', 'Treating 1.5 kg as 1 kg 5 g instead of 1 kg 500 g.']
    },
    time: {
      method: ['There are 60 minutes in an hour, not 100. Do not use column subtraction on times.', 'To find how long something takes, count on: first to the next o\'clock, then to the end time.', 'To change 24-hour times after midday to 12-hour times, take 12 from the hours and add pm.', 'Learn the other facts: 60 seconds, 24 hours, 7 days, 52 weeks, 365 days (366 in a leap year).'],
      checklist: ['Count on to the hour', '60 minutes in an hour', 'am or pm', '24-hour clock'],
      traps: ['Subtracting times like ordinary numbers (10:15 − 9:50 is not 65 minutes).', 'Mixing up 12:00 midday and midnight.']
    },
    money: {
      method: ['Change to pence when it makes the sum easier: £3.45 = 345p.', 'For change, count up from the cost to the amount paid.', 'For best value, work out the cost of one item in each deal.', 'Write the answer with two decimal places: £4.50, not £4.5.'],
      checklist: ['Pounds or pence?', 'Count up for change', 'Price of one', 'Two decimal places'],
      traps: ['Mixing pounds and pence in one sum.', 'Thinking the biggest pack is always the best value.']
    },
    area_perimeter: {
      method: ['Perimeter is the distance all the way round: add every side.', 'Area of a rectangle = length × width, in square units (cm²).', 'Area of a triangle = half of base × height.', 'For L-shapes, split into rectangles, or take a small rectangle away from a big one.', 'Find any missing side lengths first.'],
      checklist: ['Perimeter: add all sides', 'Area: length × width', 'Units: cm or cm²', 'Missing sides first'],
      traps: ['Mixing up area and perimeter.', 'Forgetting the sides you cannot see labelled on an L-shape.', 'Forgetting to halve for a triangle.']
    },
    angles: {
      method: ['Know the key facts: right angle 90°, straight line 180°, all the way round 360°.', 'Angles in a triangle add to 180°. In a quadrilateral they add to 360°.', 'Write down what you know, then take away from the total.', 'Look for clues: equal sides mean equal angles in an isosceles triangle.'],
      checklist: ['Straight line 180°', 'Around a point 360°', 'Triangle 180°', 'Quadrilateral 360°', 'Equal sides, equal angles'],
      traps: ['Using 360° for a straight line.', 'Forgetting that the two base angles of an isosceles triangle are equal.']
    },
    shapes: {
      method: ['For 2D shapes, look at the number of sides, equal sides, parallel sides, right angles and lines of symmetry.', 'For 3D shapes count faces (flat surfaces), edges (where faces meet) and vertices (corners).', 'A prism has the same shape at both ends. A pyramid comes to a point.', 'A regular shape has all sides and all angles equal.'],
      checklist: ['Sides', 'Parallel sides', 'Right angles', 'Lines of symmetry', 'Faces, edges, vertices'],
      traps: ['Mixing up edges and vertices.', 'Thinking every four-sided shape with equal sides is a square (a rhombus has no right angles).']
    },
    coordinates: {
      method: ['Coordinates are written (x, y): along the corridor, then up the stairs.', 'Moving right or left changes the first number. Moving up or down changes the second.', 'For a missing corner of a rectangle, match the x of one corner and the y of another.', 'Negative numbers are left of or below the zero point.'],
      checklist: ['Along, then up', 'x first', 'Negative = left or down', 'Opposite sides line up'],
      traps: ['Writing the numbers the wrong way round.', 'Moving the wrong way across zero.']
    },
    data: {
      method: ['Read the title, the labels and the scale before you answer.', 'Mean: add them all, divide by how many. Median: put in order, take the middle. Mode: the most common. Range: biggest − smallest.', 'For pie charts, the whole circle (360°) is everyone.', 'For line graphs, read across from the axis carefully.'],
      checklist: ['Read the scale', 'Mean', 'Median: order first', 'Mode', 'Range'],
      traps: ['Finding the median without putting the numbers in order.', 'Reading a scale as going up in 1s when it goes up in 2s or 5s.']
    },
    word_problems: {
      method: ['Read the whole question, then read it again.', 'Underline the numbers and the key words: "each", "altogether", "how many more", "left".', 'Decide what to do first, second and third. Write each step down.', 'Check the answer makes sense in the story, and has the right units.'],
      checklist: ['What is the question?', 'Key words', 'One step at a time', 'Units', 'Does it make sense?'],
      traps: ['Stopping after the first step of a two-step problem.', 'Using all the numbers just because they are there.']
    }
  };
  window.BANK.maths.topics.forEach(t => Object.assign(t.lesson, more[t.id] || {}));
})();
