using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace CafeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CafesController : ControllerBase
    {
        private readonly ICafeRepository _cafeRepository;

        public CafesController(ICafeRepository cafeRepository)
        {
            _cafeRepository = cafeRepository;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Cafe>> Get()
        {
            return Ok(_cafeRepository.GetAll());
        }

        [HttpGet("{id}")]
        public ActionResult<Cafe> Get(int id)
        {
            var cafe = _cafeRepository.GetById(id);
            if (cafe == null) return NotFound();
            return Ok(cafe);
        }

        [HttpPost]
        public ActionResult<Cafe> Post([FromBody] Cafe cafe)
        {
            var created = _cafeRepository.Create(cafe);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] Cafe cafe)
        {
            var result = _cafeRepository.Update(id, cafe);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result = _cafeRepository.Delete(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}