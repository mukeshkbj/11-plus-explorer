/* Non-Verbal and Spatial Reasoning course. All figures are drawn as SVG by the question bank. */
window.BANK = window.BANK || {};
window.BANK.nvr = {
  id: 'nvr',
  name: 'Non-Verbal Reasoning',
  topics: [
    { id: 'odd_one_out', name: 'Odd one out', lesson: {
      text: 'Five figures are shown. Four of them share something, and one does not. Your job is to find the one that does not fit.\n\nCheck one feature at a time. Is it the type of shape? The shading (white, grey or black)? The number of shapes or dots? The number of sides? The way the shape is facing?\n\nIf every figure is different in one feature, such as five different shapes, that feature is not the rule. Move on and check the next one. In harder questions the rule links two things, such as the number of dots matching the number of sides.',
      example: 'A white square, a white star, a black circle, a white triangle and a white hexagon. The shapes are all different, so look at shading: four are white and one is black. The black circle is the odd one out.',
      watch: 'Do not choose a figure just because it looks unusual. You must be able to say what the other four have in common.' } },
    { id: 'nvr_sequences', name: 'Sequences', lesson: {
      text: 'A row of boxes shows a pattern that changes step by step. You choose the figure that comes next.\n\nFollow one thing at a time from box to box. Does the shape turn? If so, how far and which way? Does the shading change in a repeating order? Does the shape grow or shrink? Does a dot move round the corners? Is a dot added or taken away each time?\n\nIn harder questions two or three things change at once. Work out each change separately, then put them together to build the next figure. Cross out any option that gets one of the changes wrong.',
      example: 'An arrow points up, then right, then down, then left. It turns a quarter turn clockwise each time, so next it points up again.',
      watch: 'Check the direction of a turn carefully. Clockwise goes the way the hands of a clock move.' } },
    { id: 'analogies', name: 'Analogies', lesson: {
      text: 'The first figure has been changed in some way to make the second figure. You must change the third figure in exactly the same way.\n\nDescribe the change in words. Perhaps the shape turned a quarter turn, or it got smaller, or black and white swapped over, or a small copy appeared inside, or the picture was flipped like a reflection.\n\nThen apply those same words to the third figure. The answer keeps the third figure\'s own shape: only the change is copied, not the first picture.',
      example: 'A white square becomes a black square. A white triangle must become a black triangle.',
      watch: 'Sometimes two changes happen together, such as turning and changing shade. Make sure your answer has both.' } },
    { id: 'matrices', name: 'Matrices', lesson: {
      text: 'A matrix is a grid of figures with one box left empty. The figures follow rules along the rows and down the columns.\n\nLook along the top row. What stays the same in every box, and what changes? Then look down the first column and ask the same questions.\n\nA common pattern is that each row has its own shape while each column has its own shading. In harder grids every row and every column contains each shape once and each shading once, like a puzzle where nothing repeats in a line.\n\nUse both rules to work out the missing box.',
      example: 'Row 1 is all circles, row 2 all squares, row 3 all stars. Column 1 is white, column 2 grey, column 3 black. The box in row 3, column 2 must be a grey star.',
      watch: 'Check your answer against the column as well as the row. It has to fit both.' } },
    { id: 'nvr_codes', name: 'Codes', lesson: {
      text: 'Each figure has a code made of letters underneath it. Each letter tells you about one feature of the figure, such as its shape, its shading or how many shapes there are.\n\nFind two figures that share a letter. Then ask what those two figures have in common. That is what the letter stands for.\n\nDo this for each position in the code. The first letters all describe the same kind of feature, and so do the second letters.\n\nOnce you know what every letter means, build the code for the last figure one letter at a time.',
      example: 'A white circle is AX and a black circle is AY. Both are circles and both start with A, so A means circle. X means white and Y means black. A black square coded BY tells you B means square.',
      watch: 'Keep the letters in the right order. If shape comes first in the examples, it comes first in your answer.' } },
    { id: 'reflections', name: 'Reflections', lesson: {
      text: 'A reflection is what you see in a mirror. The dashed line is the mirror line, and you must choose the picture that would appear on the other side.\n\nEvery part of the shape stays the same distance from the mirror line, but on the opposite side. Parts touching the line still touch it. Parts far from the line stay far away.\n\nWith a vertical mirror line, left and right swap over but nothing moves up or down. With a horizontal mirror line, top and bottom swap over but nothing moves left or right.',
      example: 'An L-shape has its long side next to a vertical mirror line. In the reflection, the long side is still next to the line and the foot of the L points the opposite way.',
      watch: 'A reflection is not the same as a turn. If the shape looks rotated instead of flipped, it is the wrong answer.' } },
    { id: 'rotations', name: 'Rotations', lesson: {
      text: 'A rotation turns a shape round, like turning a page on the table. The shape itself does not change at all.\n\nYou are shown a shape and must find the option that is the same shape turned round. The wrong options are usually mirror images, which have been flipped over, or shapes with a shaded square in the wrong place.\n\nChoose one easy feature, such as the shaded square, and note what is next to it. Then check each option: is the same thing still next to it, on the same side as you go round?\n\nIt can help to turn the paper, or to imagine turning your head.',
      example: 'A shape like the letter L, with a black square at the top. After a half turn the L is upside down and the black square is at the bottom.',
      watch: 'A mirror image can look very like a rotation. Trace round the shape from the shaded square in a clockwise direction and compare.' } },
    { id: 'hidden_shapes', name: 'Hidden shapes', lesson: {
      text: 'A simple shape is hidden inside one of five more complicated figures. It is exactly the same size and the same way up, but extra lines have been drawn across and around it.\n\nStudy the shape first. Notice its most unusual feature, such as a slanting side, a sharp point or a step.\n\nSearch each figure for that feature. When you find it, check that the rest of the shape is there too, with every side complete.\n\nIn the wrong options the shape may be turned round, flipped over, or missing one of its sides.',
      example: 'The shape is a right-angled triangle with the slanting side going down from left to right. Look in each figure for a slanting line going that way, then check the two straight sides join its ends.',
      watch: 'The hidden shape is never rotated or flipped. If you have to turn it to make it fit, it is not the answer.' } },
    { id: 'nets', name: 'Nets of cubes', lesson: {
      text: 'A net is a flat pattern that folds up to make a solid shape. A cube has six square faces, so a cube net has six squares. Not every pattern of six squares works: some fold so that two squares land on the same face.\n\nChoose one square as the base and imagine folding the others up around it.\n\nFaces that are opposite on the cube never touch. In a straight row of squares, a square is opposite the one two places along. Squares that share an edge in the net are neighbours on the cube, so they can never be opposite.\n\nA picture of a cube shows three faces. It can never show two faces that are opposite each other.',
      example: 'In a row of four squares A, B, C, D: A is opposite C, and B is opposite D. The two squares left over are opposite each other.',
      watch: 'A net with four squares in a row needs one extra square on each side of the row, not two on the same side.' } },
    { id: 'views_3d', name: '3D views', lesson: {
      text: 'These questions show a shape built from cubes. You may be asked how many cubes there are, or what the shape looks like from above, from the front or from the side.\n\nTo count cubes, go one stack at a time. Remember the cubes you cannot see, underneath the top cube of each stack.\n\nThe view from above is called the plan. Each stack looks like one square, however tall it is.\n\nFrom the front or the side you see an outline. For each column in the outline, the height is the tallest stack in that line.',
      example: 'A stack of 3 cubes stands behind a stack of 1. From the front you see a column 3 high, because the tall stack shows above the short one. From above you see two squares.',
      watch: 'Check which way you are looking. The view from the front and the view from the side are often different, and mirror images are common traps.' } },
    { id: 'belongs_group', name: 'Which belongs to the group?', lesson: {
      text: 'A box shows a group of figures that all share something. You choose which option belongs with them.\n\nFirst look at what CHANGES from figure to figure: that cannot be the rule. Then look for what stays the SAME in every figure: the number of shapes, a shading, a position, or a link between two things (such as dots matching sides).',
      example: 'Three figures each have a big shape with the same number of dots as it has sides: a triangle with 3 dots, a square with 4, a hexagon with 6. The answer is the pentagon with 5 dots.',
      watch: 'Do not pick an option just because it looks like one of the group. It must follow the rule that ALL of them share.' } },
    { id: 'paper_folding', name: 'Fold and punch', lesson: {
      text: 'A square of paper is folded, and holes are punched through all the layers. You work out where the holes are when the paper is opened out.\n\nEvery hole goes through each layer. When you unfold, each hole appears again as a mirror image across the fold line, the same distance from the fold. So one fold doubles the number of holes, and two folds make four times as many.',
      example: 'The left half is folded onto the right half and one hole is punched near the top right corner. When unfolded there are two holes: the one at the top right and its mirror image at the top left.',
      watch: 'The new holes are reflected, not slid across. A hole close to the fold line stays close to it on the other side.' } },
    { id: 'symmetry_complete', name: 'Complete the symmetry', lesson: {
      text: 'Half of a pattern is drawn on a grid, with a dashed mirror line. You choose the picture that completes the pattern so that both halves are mirror images.\n\nEvery shaded square needs a partner on the other side, the same number of squares from the line. For a diagonal mirror line, a square crosses the diagonal: its row and column swap.',
      example: 'A black square is 1 square to the left of an upright mirror line, in the top row. Its partner is 1 square to the right of the line, also in the top row.',
      watch: 'A pattern that is copied across (slid) is not a reflection. Check squares near the line and far from it.' } },
    { id: 'combine_shapes', name: 'Join the shapes', lesson: {
      text: 'Two pieces made of squares are joined edge to edge. They are not turned or flipped. You choose the shape they could make.\n\nCount the squares first: the answer has the same total. Then find the first piece inside each option, facing the same way, and check that what is left is exactly the second piece.',
      example: 'An L-shaped piece of 3 squares and a straight piece of 2 squares make a shape of 5 squares. Any option with 4 or 6 squares can be crossed out straight away.',
      watch: 'Options often show one piece turned or flipped. That is not allowed here.' } },
  ],
  flashcards: [
    { front: 'What is a rotation?', back: 'A turn. The shape stays the same but faces a different way.' },
    { front: 'What is a reflection?', back: 'A flip in a mirror line. Left and right (or top and bottom) swap over.' },
    { front: 'How many degrees in a quarter turn?', back: '90°' }, { front: 'How many degrees in a half turn?', back: '180°' },
    { front: 'Which way is clockwise?', back: 'The way the hands of a clock move: top, right, bottom, left.' },
    { front: 'How many faces, edges and corners does a cube have?', back: '6 faces, 12 edges, 8 corners' },
    { front: 'In a cube net, which squares are opposite in a straight row?', back: 'Squares that are two apart' },
    { front: 'What is a plan view?', back: 'The view looking straight down from above' },
    { front: 'How many different nets make a cube?', back: '11' },
    { front: 'Five things to check in a sequence', back: 'Shape, shading, size, turning, number of parts' }
  ],
  questions: []
};

/* Deeper lesson notes for each topic: a step-by-step method, a checklist of things to look at, and common traps.
   The app shows these under the lesson, followed by a "Try one together" question. */
(function () {
  const more = {
    odd_one_out: {
      method: ['Look at all five figures before you choose.', 'Check one feature at a time in every figure: shape first, then shading, number, size, direction and position.', 'If a feature is different in every figure (say, five different shapes), it is not the rule. Move on to the next one.', 'When four figures share something, check that the fifth really breaks it.', 'Nothing simple? Look for a link between two features, such as the number of dots matching the number of sides.'],
      checklist: ['Shape', 'Shading', 'How many parts', 'Number of sides', 'Size', 'Direction', 'Position', 'Inside or outside', 'Turned or flipped'],
      traps: ['Picking the figure that simply looks the most different, without a rule.', 'Stopping at the first difference: make sure the other four really do match each other.', 'Forgetting that turning a shape does not change it, but flipping it over does.']
    },
    nvr_sequences: {
      method: ['Say what changes between box 1 and box 2.', 'Check that the same change happens between boxes 2 and 3, and boxes 3 and 4.', 'Look for more than one change. Shape, shading, number, position and turning can all change at once.', 'If the pattern seems to break, check whether it alternates: boxes 1, 3 and 5 follow one rule, and boxes 2 and 4 follow another.', 'Make every change once more to box 4, then find the option that matches all of them.'],
      checklist: ['Turning: how far and which way?', 'Moving round the corners', 'Adding or taking away', 'Shading pattern', 'Getting bigger or smaller', 'One more side', 'Alternating'],
      traps: ['Noticing one change when there are two.', 'Mixing up clockwise and anticlockwise.', 'Choosing the option that just copies the last box.']
    },
    analogies: {
      method: ['Describe in words how the first figure becomes the second. For example: "it makes a quarter turn clockwise and the shading swaps".', 'Check every part: shape, shading, size, direction, number, and what is inside or outside.', 'Make exactly the same changes to the third figure.', 'Rule out options that make only one of the changes, or the right change the wrong way round.'],
      checklist: ['Turned?', 'Flipped?', 'Shading swapped?', 'Bigger or smaller?', 'Inside and outside swapped?', 'Something added or taken away?'],
      traps: ['Copying the second figure instead of changing the third one.', 'Turning the wrong way.', 'Seeing only one of two changes.']
    },
    matrices: {
      method: ['Look along the top row. What stays the same and what changes?', 'Check that the same rule works in the middle row.', 'Now look down the columns.', 'Many grids use "one of each": each row and column has each shape, shading or number once. Work out which one is missing.', 'Choose the option that fits both the row and the column.'],
      checklist: ['Same in each row', 'Changes going across', 'One of each', 'Counting', 'Turning across', 'Adding boxes together'],
      traps: ['Checking only the row, or only the column.', 'Forgetting that the number of shapes can be part of the rule.']
    },
    nvr_codes: {
      method: ['Each letter stands for one feature, such as shape, shading or number.', 'Find two figures that share a first letter. What else do they have in common? That is what the first letter means.', 'Do the same for the second letter, and the third if there is one.', 'Build the code for the new figure one letter at a time.', 'Check each letter against the examples before you choose.'],
      checklist: ['Shape', 'Shading', 'Number', 'Size', 'Direction'],
      traps: ['Mixing up which letter goes with which feature.', 'Choosing a code with the right letters in the wrong order.']
    },
    reflections: {
      method: ['Look at the mirror line. An upright line swaps left and right. A flat line swaps top and bottom.', 'Pick one part and see how far it is from the mirror line. In the reflection it is the same distance away on the other side.', 'Check that each shape is flipped as well as moved.', 'Check every part, including the shading.'],
      checklist: ['Same distance from the line', 'Left ↔ right for an upright line', 'Top ↔ bottom for a flat line', 'Each shape flipped', 'Shading stays the same'],
      traps: ['Choosing the figure turned upside down instead of reflected.', 'Moving the parts across but forgetting to flip them.']
    },
    rotations: {
      method: ['Work out the turn: a quarter turn (90°) or a half turn (180°), clockwise or anticlockwise.', 'Choose one part, such as the black shape, and follow it. In a quarter turn clockwise, the top goes to the right.', 'Check a second part the same way.', 'Make sure the answer is turned, not flipped.'],
      checklist: ['Clockwise ↻ or anticlockwise ↺', 'Quarter or half turn', 'Follow one part', 'Not a mirror image'],
      traps: ['Turning the wrong way.', 'Choosing a mirror image.', 'Moving the parts round but not turning each one.']
    },
    hidden_shapes: {
      method: ['Study the small shape. Count its sides and spot its most unusual corner or slanted line.', 'Find that corner in the big figure.', 'Trace the outline from there, one side at a time.', 'The hidden shape is the same size and faces the same way. It is never turned or flipped.'],
      checklist: ['Same size', 'Same direction', 'Same angles', 'Every side is there'],
      traps: ['Choosing a shape that has been flipped or turned.', 'Choosing a shape with one side missing from the big figure.']
    },
    nets: {
      method: ['Find the opposite faces first. In a straight line of three squares, the two end squares are opposite.', 'Opposite faces can never be seen together on a cube.', 'Cross out any option that shows an opposite pair.', 'For the options left, check the order of the three faces going round the corner.'],
      checklist: ['Opposite pairs', 'Never seen together', 'Order round the corner'],
      traps: ['Forgetting that squares two apart in a row are opposite.', 'Not checking the order round the corner (a mirror image).'],
      extra: 'Best tip of all: draw a net on paper, cut it out and fold it. Doing it for real a few times makes these questions much easier.'
    },
    belongs_group: {
      method: ['Look at the figures in the box one feature at a time: number of shapes, shading, sides, position.', 'Cross out anything that changes between the figures: it is not the rule.', 'Find what is true for EVERY figure in the box.', 'Check each option against that rule.'],
      checklist: ['What changes?', 'What stays the same?', 'True for all of them?', 'Only one option fits'],
      traps: ['Choosing an option because it looks like one figure in the box.', 'Using a rule that only works for two of the figures.']
    },
    paper_folding: {
      method: ['Follow the folds in order and see which part of the paper the holes go through.', 'Unfold one fold at a time, starting with the last one.', 'Each time you unfold, reflect every hole across that fold line.', 'Count the holes: one fold gives twice as many, two folds four times as many.'],
      checklist: ['Where is the fold line?', 'Reflect, do not slide', 'Same distance from the fold', 'Right number of holes'],
      traps: ['Sliding the holes across instead of reflecting them.', 'Reflecting across the wrong line.', 'Forgetting to unfold the second fold.']
    },
    symmetry_complete: {
      method: ['Find the mirror line.', 'Take one shaded square and count how far it is from the line.', 'Count the same distance on the other side and check that square is shaded in the option.', 'Do this for every square, including grey ones.'],
      checklist: ['Mirror line', 'Same distance', 'Same row (or column)', 'Every square'],
      traps: ['Choosing a pattern that has been slid across instead of reflected.', 'Missing one square near the mirror line.']
    },
    combine_shapes: {
      method: ['Count the squares in both pieces and add them.', 'Cross out options with the wrong number of squares.', 'Find the first piece inside each option, facing the same way.', 'Check the rest is exactly the second piece, not turned or flipped.'],
      checklist: ['Total squares', 'First piece facing the same way', 'Second piece facing the same way'],
      traps: ['Allowing a piece to be turned or flipped.', 'Forgetting to count the squares first.']
    },
    views_3d: {
      method: ['Check which way you are looking: from above, from the front (the arrow) or from the side.', 'From above, you see one square for every stack, however tall it is.', 'From the front, you see the tallest stack in each column. Shorter stacks behind it are hidden.', 'Work column by column or row by row, then compare with the options.'],
      checklist: ['Which direction?', 'Count the stacks', 'Tallest in each column', 'Left and right the right way round'],
      traps: ['Mixing up the front view and the side view.', 'Choosing the view from behind, which has left and right swapped.']
    }
  };
  window.BANK.nvr.topics.forEach(t => Object.assign(t.lesson, more[t.id] || {}));
})();
