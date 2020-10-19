function getScrollParent(el) {
    let parent = el.parentNode;
    while(parent){
        if(/(scroll)|(auto)/.test(getComputedStyle(parent)['overflow'])) return parent;
        parent = parent.parentNode;
    }
    return parent
}
const loadImageAsync = (src,resolve,reject)=>{
    let image = new Image();
    image.src = src;
    image.onload = resolve;
    image.onerror = reject;
}
const Lazy = (Vue)=>{
    class ReavtiveListener {
        constructor({el,src,options,elRender}){
            this.el = el;
            this.src = src;
            this.options = options;
            this.elRender = elRender;
            this.state = {loading:false};
        }
        checkInView(){
            let {top} = this.el.getBoundingClientRect();
            return top < window.innerHeight *( this.options.preLoad || 1.3);
        }
        load(){
            this.elRender(this,'loading');
            loadImageAsync(this.src,()=>{
                this.state.loading = true;
                this.elRender(this,'finish');
            },()=>{
                this.state.error = true;
                this.elRender(this,'error');
            })
        }
    }
    return class LazyClass{
        constructor(options){
            this.options = options;
            this.bindHanlder = false;
            this.listenerQueue = [];
        }
        handlerLazyload(){
            // 是否显示图片
            this.listenerQueue.forEach(listener=>{
                if(!listener.state.loading){
                    let catIn = false;
                    catIn = listener.checkInView();
                    if(catIn) listener.load();
                }
            })
        }
        elRender(listener,state){
            let el = listener.el;
            let src = '';
            switch (state) {
                case 'loading':
                    src = listener.options.loading || '';
                    break;
                case 'error':
                    src = listener.options.error || '';
                    break;
                default:
                    src = listener.src;
                    break;
            }
            el.setAttribute('src',src);
        }

        add(el,binding){
            Vue.nextTick(_=>{
                console.log(binding);
                let scrollParent = getScrollParent(el);
                if(scrollParent && !this.bindHanlder){
                    this.bindHanlder = true;
                    scrollParent.addEventListener('scroll',this.handlerLazyload.bind(this))
                }
                const listener = new ReavtiveListener({
                    el,
                    src:binding.value,
                    options:this.options,
                    elRender:this.elRender.bind(this),
                }
                )
                this.listenerQueue.push(listener);
                this.handlerLazyload();
            })
        }
    }
}

const VueLazyLoad = {
    install(Vue,options){
        const LazyClass = Lazy(Vue);
        const lazy = new LazyClass(options);
        Vue.directive('lazy',{
            bind:lazy.add.bind(lazy)
        })
    }
}