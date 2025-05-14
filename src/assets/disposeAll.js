export function disposeAll(obj) {
    // 递归遍历场景图
    if (obj.children) {
        obj.children.forEach((child) => disposeAll(child));
    }

    // 释放几何体和材质
    if (obj.geometry) {
        obj.geometry.dispose();
    }

    if (obj.material) {
        if (Array.isArray(obj.material)) {
            obj.material.forEach(material => {
                // 释放材质相关的纹理
                Object.keys(material).forEach(prop => {
                    if (!material[prop]) return;
                    if (material[prop].isTexture) {
                        material[prop].dispose();
                    }
                });
                material.dispose();
            });
        } else if (obj.material) {
            // 释放材质相关的纹理
            Object.keys(obj.material).forEach(prop => {
                if (!obj.material[prop]) return;
                if (obj.material[prop].isTexture) {
                    obj.material[prop].dispose();
                }
            });
            obj.material.dispose();
        }
    }
}