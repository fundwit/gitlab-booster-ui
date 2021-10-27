<template>
    <el-radio-group v-model="selectedMRIID">
        <div v-for="mr in mrs" :key="mr.iid">
            <el-radio :disabled="isMergeable(mr) === false" :label="mr.iid">
                <i :style="{color: isMergeable(mr) === true ? 'green' : 'red'}"
                    :class="isMergeable(mr) === true ? 'el-icon-success' : 'el-icon-error'"/>

                {{ mr.iid }}
                <a target="_blank" :href="mr.web_url"> {{ mr.title}}</a>
                ({{ mr.state }} - {{ mr.merge_status}})
                {{ mr.source_branch}} =》 {{mr.target_branch}}
            </el-radio>
        </div>
    </el-radio-group>
</template>

<script>
import _ from 'lodash'

export default {
    name: "MRList",
    props: {
        repoId: null,
        mrs: null
    },
    data () {
        return {
            selectedMRIID: null
        }
    },
    mounted () {
        const mergeableItems = _.filter(this.mrs, mr => this.isMergeable(mr))
        if (mergeableItems.length === 1) {
            this.selectedMRIID = mergeableItems[0].iid
        }
    },
    watch: {
        selectedMRIID (val) {
            debugger
            this.$emit("selected", this.repoId, val)
        }
    },
    methods: {
        isMergeable(mr) {
            return mr.merge_status === 'can_be_merged' && mr.state === 'opened'
        }
    }
}
</script>

<style scoped>
</style>