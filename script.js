 
// // Javascript is only for cycling the pokemon animations
// // and changing the sprites randomly. Not necessary.

// const src = "https://img.pokemondb.net/sprites/black-white/anim/normal/";

// const iChooseYou = () => {
//   const pkmn = $(".pkmn");
//   pkmn.removeClass("exit");
//   setTimeout(() => {
//     const poke1 = pokes[Math.floor(Math.random()*pokes.length)];
//     const poke2 = pokes[Math.floor(Math.random()*pokes.length)];
//     $("#app").attr(`style`,`
//       --poke1:url(${src}${poke1}.gif);
//       --poke2:url(${src}${poke2}.gif);
//     `);
//     pkmn.addClass("exit");
//   },100);
//   clearTimeout(timer);
//   timer = setTimeout(iChooseYou,9000);
// }

// $("body").on("click", iChooseYou);
// let timer = setTimeout(iChooseYou,6000);



// $("input").on("change", (e) => {
//   if ( $(e.currentTarget).is(":checked") ) {
//     $("body").attr(`style`,`--slowmo: 5s; --slowsplode: 2s`);
//   } else {
//     $("body").attr("style","");
//   }
// })

// const pokes = [
//   "bulbasaur",
//   "squirtle",
//   "charmander",
//   "chikorita",
//   "totodile",
//   "cyndaquil",
//   "pikachu",
//   "eevee",
//   "jigglypuff",
//   "psyduck",
//   "togepi",
//   "meowth"
// ];
const pkmn = document.querySelector(".pkmn");
const ball = pkmn.querySelector(".ball");
const explode = pkmn.querySelector(".explode");
const message = document.querySelector(".message");

pkmn.addEventListener("click", () => {
  // Stop rocking
  ball.classList.remove("rock");


  // Start explosion shortly after opening
  setTimeout(() => {
  // Open the ball
  ball.classList.add("open");
    pkmn.classList.add("explode-full");
  }, 400); // tweak delay so ball open looks good

  // Hide ball and show message after explosion
  setTimeout(() => {
    ball.style.opacity = 0;
    explode.style.opacity = 0;
    message.classList.add("show");
  }, 1600); // match your explosion animation duration
});
