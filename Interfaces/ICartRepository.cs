using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Contrato para operaciones asíncronas del carrito.
    public interface ICartRepository
    {
        // ✅ Obtiene el carrito activo del usuario.
        Task<CartResponseDto> GetCartByUserIdAsync(
            int userId
        );

        // ✅ Agrega un producto al carrito.
        Task AddItemAsync(
            int userId,
            int cafeId,
            int cantidad
        );

        // ✅ Actualiza cantidad.
        Task<bool> UpdateQuantityAsync(
            int cartItemId,
            int cantidad
        );

        // ✅ Elimina producto.
        Task<bool> RemoveItemAsync(
            int cartItemId
        );

        // ✅ Vacía carrito.
        Task<bool> ClearCartAsync(
            int userId
        );
    }
}
