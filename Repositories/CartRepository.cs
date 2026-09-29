using CafeApi.DTOs;
using CafeApi.Interfaces;

namespace CafeApi.Repositories
{
    // ✅ Implementación del repositorio del carrito.
    public class CartRepository : ICartRepository
    {
        // ✅ Cadena de conexión PostgreSQL.
        private readonly string _connectionString;

        // ✅ Constructor del repositorio.
        public CartRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public Task AddItemAsync(
            int userId,
            int cafeId,
            int cantidad)
        {
            throw new NotImplementedException();
        }

        public Task<bool> ClearCartAsync(
            int userId)
        {
            throw new NotImplementedException();
        }

        public Task<CartResponseDto?> GetCartByUserIdAsync(
            int userId)
        {
            throw new NotImplementedException();
        }

        public Task<CartItemResponseDto?> GetItemAsync(
            int cartItemId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<CartItemResponseDto>>
            GetItemsAsync(
            int userId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> ItemExistsAsync(
            int userId,
            int cafeId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> RemoveItemAsync(
            int cartItemId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> UpdateQuantityAsync(
            int cartItemId,
            int cantidad)
        {
            throw new NotImplementedException();
        }
    }
}